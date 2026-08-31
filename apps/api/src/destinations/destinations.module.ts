import { Module } from '@nestjs/common';
import { DeliveryModule } from '../delivery/delivery.module';
import { DestinationsController } from './destinations.controller';
import { DestinationsService } from './destinations.service';

@Module({
  imports: [DeliveryModule],
  controllers: [DestinationsController],
  providers: [DestinationsService],
})
export class DestinationsModule {}
