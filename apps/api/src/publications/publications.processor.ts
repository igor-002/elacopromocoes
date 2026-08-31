import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { DeliveryService, DeliveryUnknownError } from '../delivery/delivery.service';
import { PrismaService } from '../prisma/prisma.service';
import { PUBLICATION_QUEUE } from './queue.constants';

interface PublicationJob {
  publicationId: string;
}

@Processor(PUBLICATION_QUEUE, { concurrency: 3 })
export class PublicationsProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly delivery: DeliveryService,
  ) {
    super();
  }

  async process(job: Job<PublicationJob>): Promise<void> {
    const publication = await this.prisma.publication.findUnique({
      where: { id: job.data.publicationId },
      include: { offer: true, destination: true },
    });
    if (!publication) return;
    if (publication.status === 'SENDING') {
      await this.prisma.publication.updateMany({
        where: { id: publication.id, status: 'SENDING' },
        data: { status: 'UNKNOWN', error: 'Processamento interrompido antes da confirmacao.' },
      });
      return;
    }
    if (publication.status !== 'SCHEDULED') return;

    const claimed = await this.prisma.publication.updateMany({
      where: { id: publication.id, status: 'SCHEDULED' },
      data: { status: 'SENDING', error: null },
    });
    if (!claimed.count) return;

    const attempt = job.attemptsMade + 1;
    try {
      const result = await this.delivery.send(publication.destination, publication.offer);
      await this.prisma.publication.update({
        where: { id: publication.id },
        data: {
          status: 'SENT',
          attempts: attempt,
          externalMessageId: result.externalMessageId,
          error: null,
          sentAt: new Date(),
        },
      });
      await this.prisma.auditLog.create({
        data: { action: 'SENT', entity: 'Publication', entityId: publication.id },
      });
    } catch (error) {
      const message = safeError(error);
      if (error instanceof DeliveryUnknownError) {
        await this.prisma.publication.update({
          where: { id: publication.id },
          data: { status: 'UNKNOWN', attempts: attempt, error: message },
        });
        return;
      }

      const finalAttempt = attempt >= (job.opts.attempts ?? 1);
      await this.prisma.publication.update({
        where: { id: publication.id },
        data: {
          status: finalAttempt ? 'FAILED' : 'SCHEDULED',
          attempts: attempt,
          error: message,
        },
      });
      if (finalAttempt) {
        await this.prisma.auditLog.create({
          data: {
            action: 'FAILED',
            entity: 'Publication',
            entityId: publication.id,
            metadata: { error: message },
          },
        });
      }
      throw error;
    }
  }
}

function safeError(error: unknown): string {
  return (error instanceof Error ? error.message : 'Falha desconhecida.').slice(0, 500);
}
