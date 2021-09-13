import { Module } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CampaignController } from './campaign.controller';
import { CampaignService } from './campaign.service';

@Module({
  controllers: [CampaignController],
  providers: [CampaignService, PrismaService],
})
export class CampaignModule {}
