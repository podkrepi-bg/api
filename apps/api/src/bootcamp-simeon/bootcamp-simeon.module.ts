import { Module } from '@nestjs/common';
import { BootcampSimeonService } from './bootcamp-simeon.service';
import { BootcampSimeonController } from './bootcamp-simeon.controller';

@Module({
  controllers: [BootcampSimeonController],
  providers: [BootcampSimeonService]
})
export class BootcampSimeonModule {}
