import { Module } from '@nestjs/common';
import { InfoRequestService } from './info-request.service';
import { InfoRequestController } from './info-request.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [InfoRequestController],
  providers: [InfoRequestService, PrismaService]
})
export class InfoRequestModule {}
