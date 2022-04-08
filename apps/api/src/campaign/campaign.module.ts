import { forwardRef, Module } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { VaultModule } from '../vault/vault.module'
import { VaultService } from '../vault/vault.service'
import { CampaignTypeController } from './campaign-type.controller'
import { CampaignController } from './campaign.controller'
import { CampaignService } from './campaign.service'

@Module({
  imports: [forwardRef(() => VaultModule)],
  controllers: [CampaignController, CampaignTypeController],
  providers: [CampaignService, PrismaService, VaultService],
})
export class CampaignModule {}
