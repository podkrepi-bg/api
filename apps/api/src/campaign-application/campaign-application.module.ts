import { Module } from '@nestjs/common'
import { CampaignApplicationService } from './campaign-application.service'
import { CampaignApplicationController } from './campaign-application.controller'

@Module({
  controllers: [CampaignApplicationController],
  providers: [CampaignApplicationService],
})
export class CampaignApplicationModule {}
