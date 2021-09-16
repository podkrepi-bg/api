import { Controller, Get } from '@nestjs/common'
import { Public, Resource, Scopes } from 'nest-keycloak-connect'

import { CampaignService } from './campaign.service'

@Controller('campaign')
@Resource('campaign')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Get('list')
  @Public()
  @Scopes('view')
  getData() {
    return this.campaignService.listCampaigns()
  }
}
