import { Controller, Get } from '@nestjs/common'

import { CampaignService } from './campaign.service'

@Controller('campaign')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Get('list')
  getData() {
    return this.campaignService.listCampaigns()
  }
}
