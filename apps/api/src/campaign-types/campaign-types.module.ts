import { Module } from '@nestjs/common';
import { CampaignTypesService } from './campaign-types.service';
import { CampaignTypesController } from './campaign-types.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [CampaignTypesController],
  providers: [CampaignTypesService, PrismaService]
})
export class CampaignTypesModule { }
