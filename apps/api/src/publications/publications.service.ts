import {
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { CreatePublicationInput, PublicationDto } from '@radar/contracts';
import type { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { PUBLISH_JOB, PUBLICATION_QUEUE } from './queue.constants';
import { toPublicationDto } from './publication.mapper';

@Injectable()
export class PublicationsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(PUBLICATION_QUEUE) private readonly queue: Queue,
  ) {}

  async list(): Promise<PublicationDto[]> {
    const publications = await this.prisma.publication.findMany({
      include: { offer: true, destination: true },
      orderBy: { createdAt: 'desc' },
    });
    return publications.map(toPublicationDto);
  }

  async get(id: string): Promise<PublicationDto> {
    return toPublicationDto(await this.find(id));
  }

  async create(input: CreatePublicationInput, adminId: string): Promise<PublicationDto[]> {
    const offer = await this.prisma.offer.findUnique({ where: { id: input.offerId } });
    if (!offer) throw new NotFoundException('Oferta não encontrada.');
    if (offer.status !== 'APPROVED') {
      throw new ConflictException('A oferta precisa estar aprovada antes da publicação.');
    }

    const destinationIds = [...new Set(input.destinationIds)];
    const destinations = await this.prisma.destination.findMany({
      where: { id: { in: destinationIds }, enabled: true, deletedAt: null },
    });
    if (destinations.length !== destinationIds.length) {
      throw new ConflictException('Um ou mais destinos não existem ou estão desativados.');
    }

    const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : new Date();
    const publications = await this.prisma.$transaction(async (transaction) => {
      const created = await Promise.all(
        destinationIds.map((destinationId) =>
          transaction.publication.create({
            data: { offerId: offer.id, destinationId, scheduledAt },
            include: { offer: true, destination: true },
          }),
        ),
      );
      await transaction.auditLog.create({
        data: {
          adminId,
          action: 'SCHEDULE',
          entity: 'Offer',
          entityId: offer.id,
          metadata: { publicationIds: created.map((item) => item.id) },
        },
      });
      return created;
    });

    const enqueued = await Promise.allSettled(publications.map((item) => this.enqueue(item.id, scheduledAt)));
    const failed = enqueued
      .map((result, index) => ({ result, publication: publications[index] }))
      .filter((item) => item.result.status === 'rejected' && item.publication);
    if (failed.length) {
      for (const item of publications) {
        const job = await this.queue.getJob(item.id);
        if (job) {
          try {
            await job.remove();
          } catch {
            // Worker rechecks status before delivery.
          }
        }
      }
      await this.prisma.publication.updateMany({
        where: { id: { in: publications.map((item) => item.id) } },
        data: { status: 'FAILED', error: 'Não foi possível adicionar publicação à fila.' },
      });
      throw new ServiceUnavailableException('Fila indisponível; publicações registradas como falhas.');
    }

    return publications.map(toPublicationDto);
  }

  async cancel(id: string, adminId: string): Promise<PublicationDto> {
    const current = await this.find(id);
    if (current.status !== 'SCHEDULED') {
      throw new ConflictException('Somente publicações agendadas podem ser canceladas.');
    }

    const cancelled = await this.prisma.publication.updateMany({
      where: { id, status: 'SCHEDULED' },
      data: { status: 'CANCELLED', error: null },
    });
    if (!cancelled.count) {
      throw new ConflictException('A publicação começou a ser processada e não pode mais ser cancelada.');
    }
    const job = await this.queue.getJob(id);
    if (job) {
      try {
        await job.remove();
      } catch {
        // Processor checks CANCELLED before delivery, covering an active-job race.
      }
    }
    await this.audit(adminId, 'CANCEL', id);
    return this.get(id);
  }

  async retry(id: string, adminId: string): Promise<PublicationDto> {
    const current = await this.find(id);
    if (!['FAILED', 'UNKNOWN'].includes(current.status)) {
      throw new ConflictException('Somente publicações falhas ou incertas podem ser reenviadas manualmente.');
    }

    const existingJob = await this.queue.getJob(id);
    if (existingJob) await existingJob.remove();
    await this.prisma.publication.update({
      where: { id },
      data: { status: 'SCHEDULED', scheduledAt: new Date(), error: null, externalMessageId: null },
    });
    try {
      await this.enqueue(id, new Date());
    } catch (error) {
      await this.prisma.publication.update({
        where: { id },
        data: { status: 'FAILED', error: 'Não foi possível adicionar publicação à fila.' },
      });
      throw error;
    }
    await this.audit(adminId, 'RETRY', id);
    return this.get(id);
  }

  private enqueue(id: string, scheduledAt: Date) {
    return this.queue.add(
      PUBLISH_JOB,
      { publicationId: id },
      {
        jobId: id,
        delay: Math.max(0, scheduledAt.getTime() - Date.now()),
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
  }

  private async find(id: string) {
    const publication = await this.prisma.publication.findUnique({
      where: { id },
      include: { offer: true, destination: true },
    });
    if (!publication) throw new NotFoundException('Publicação não encontrada.');
    return publication;
  }

  private audit(adminId: string, action: string, entityId: string) {
    return this.prisma.auditLog.create({
      data: { adminId, action, entity: 'Publication', entityId },
    });
  }
}
