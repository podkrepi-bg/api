import { Module } from '@nestjs/common'

import { VaultService } from './vault.service'
import { VaultController } from './vault.controller'
import { PrismaService } from '../prisma/prisma.service'
import { CampaignService } from '../campaign/campaign.service'

@Module({
  controllers: [VaultController],
  providers: [VaultService, CampaignService, PrismaService],
})
export class VaultModule {}
