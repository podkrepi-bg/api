import { Controller, Get } from '@nestjs/common'
import { Public, Resource, Scopes } from 'nest-keycloak-connect'

import { CampaignService } from './campaign.service'

@Controller('campaign-type')
@Resource('campaign-type')
export class CampaignTypeController {
  constructor(private readonly campaignService: CampaignService) {}

  @Get('list')
  @Public()
  @Scopes('view')
  getData() {
    return this.campaignService.listCampaignTypes()
  }
}
