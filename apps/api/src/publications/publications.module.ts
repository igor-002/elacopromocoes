import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { DeliveryModule } from '../delivery/delivery.module';
import { PUBLICATION_QUEUE } from './queue.constants';
import { PublicationsController } from './publications.controller';
import { PublicationsProcessor } from './publications.processor';
import { PublicationsService } from './publications.service';

@Module({
  imports: [BullModule.registerQueue({ name: PUBLICATION_QUEUE }), DeliveryModule],
  controllers: [PublicationsController],
  providers: [PublicationsService, PublicationsProcessor],
})
export class PublicationsModule {}
