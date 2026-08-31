import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { DeliveryModule } from '../delivery/delivery.module';
import { PUBLICATION_QUEUE } from '../publications/queue.constants';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [BullModule.registerQueue({ name: PUBLICATION_QUEUE }), DeliveryModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
