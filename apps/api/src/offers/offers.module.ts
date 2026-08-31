import { Module } from '@nestjs/common';
import { CopyService } from './copy.service';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';
import { AmazonCreatorsService } from './amazon-creators.service';

@Module({
  controllers: [OffersController],
  providers: [OffersService, CopyService, AmazonCreatorsService],
  exports: [CopyService],
})
export class OffersModule {}
