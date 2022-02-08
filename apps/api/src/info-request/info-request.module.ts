import { Module } from '@nestjs/common';
import { InfoRequestService } from './info-request.service';
import { InfoRequestController } from './info-request.controller';

@Module({
  controllers: [InfoRequestController],
  providers: [InfoRequestService]
})
export class InfoRequestModule {}
