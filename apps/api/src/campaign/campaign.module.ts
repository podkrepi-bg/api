import { Module } from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service'
import { CampaignTypeController } from './campaign-type.controller'
import { CampaignController } from './campaign.controller'
import { CampaignService } from './campaign.service'

@Module({
  controllers: [CampaignController, CampaignTypeController],
  providers: [CampaignService, PrismaService],
})
export class CampaignModule {}
