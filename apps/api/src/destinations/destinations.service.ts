import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateDestinationInput,
  DestinationDto,
  UpdateDestinationInput,
} from '@radar/contracts';
import type { Prisma } from '@prisma/client';
import { DeliveryService } from '../delivery/delivery.service';
import { PrismaService } from '../prisma/prisma.service';
import { toDestinationDto } from './destination.mapper';

@Injectable()
export class DestinationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly delivery: DeliveryService,
  ) {}

  async list(): Promise<DestinationDto[]> {
    const destinations = await this.prisma.destination.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return destinations.map(toDestinationDto);
  }

  evolutionStatus() {
    return this.delivery.getEvolutionStatus();
  }

  evolutionGroups() {
    return this.delivery.listEvolutionGroups();
  }

  async get(id: string): Promise<DestinationDto> {
    return toDestinationDto(await this.find(id));
  }

  async create(input: CreateDestinationInput, adminId: string): Promise<DestinationDto> {
    const existing = await this.prisma.destination.findUnique({
      where: { channel_externalId: { channel: input.channel, externalId: input.externalId } },
    });
    if (existing && !existing.deletedAt) throw new ConflictException('Destino já cadastrado.');

    const destination = existing
      ? await this.prisma.destination.update({
          where: { id: existing.id },
          data: { name: input.name.trim(), enabled: input.enabled ?? true, deletedAt: null },
        })
      : await this.prisma.destination.create({
          data: {
            channel: input.channel,
            name: input.name.trim(),
            externalId: input.externalId.trim(),
            enabled: input.enabled ?? true,
          },
        });
    await this.audit(adminId, existing ? 'RESTORE' : 'CREATE', destination.id);
    return toDestinationDto(destination);
  }

  async update(id: string, input: UpdateDestinationInput, adminId: string): Promise<DestinationDto> {
    const current = await this.find(id);
    try {
      const destination = await this.prisma.destination.update({
        where: { id },
        data: {
          ...(input.channel !== undefined && { channel: input.channel }),
          ...(input.name !== undefined && { name: input.name.trim() }),
          ...(input.externalId !== undefined && { externalId: input.externalId.trim() }),
          ...(input.enabled !== undefined && { enabled: input.enabled }),
        },
      });
      await this.audit(adminId, 'UPDATE', destination.id);
      return toDestinationDto(destination);
    } catch (error) {
      if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') {
        throw new ConflictException('Destino já cadastrado.');
      }
      throw error;
    }
  }

  async test(id: string, adminId: string): Promise<{ ok: true; message: string }> {
    const destination = await this.find(id);
    await this.delivery.test(destination);
    await this.audit(adminId, 'TEST', id);
    return { ok: true, message: 'Mensagem de teste enviada.' };
  }

  async remove(id: string, adminId: string): Promise<void> {
    await this.find(id);
    await this.prisma.destination.update({
      where: { id },
      data: { enabled: false, deletedAt: new Date() },
    });
    await this.audit(adminId, 'DELETE', id);
  }

  private async find(id: string) {
    const destination = await this.prisma.destination.findFirst({
      where: { id, deletedAt: null },
    });
    if (!destination) throw new NotFoundException('Destino não encontrado.');
    return destination;
  }

  private audit(adminId: string, action: string, entityId: string) {
    return this.prisma.auditLog.create({
      data: { adminId, action, entity: 'Destination', entityId },
    });
  }
}
