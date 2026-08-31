import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { DeliveryService } from '../delivery/delivery.service';
import { PrismaService } from '../prisma/prisma.service';
import { PUBLICATION_QUEUE } from '../publications/queue.constants';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly delivery: DeliveryService,
    @InjectQueue(PUBLICATION_QUEUE) private readonly queue: Queue,
  ) {}

  async get() {
    const [database, redis] = await Promise.allSettled([
      this.prisma.$queryRaw`SELECT 1`,
      this.queue.getJobCounts('waiting', 'active', 'delayed', 'failed'),
    ]);
    const result = {
      status: database.status === 'fulfilled' && redis.status === 'fulfilled' ? 'ok' : 'error',
      database: database.status === 'fulfilled' ? 'up' : 'down',
      redis: redis.status === 'fulfilled' ? 'up' : 'down',
      integrations: {
        telegram: this.delivery.isTelegramConfigured() ? 'configured' : 'disabled',
        evolution: this.delivery.isEvolutionConfigured() ? 'configured' : 'disabled',
        openai: process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL ? 'configured' : 'disabled',
      },
      timestamp: new Date().toISOString(),
    };
    if (result.status === 'error') throw new ServiceUnavailableException(result);
    return result;
  }
}
