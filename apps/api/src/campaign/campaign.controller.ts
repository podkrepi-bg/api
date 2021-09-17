import { Body, Controller, Get, Post } from '@nestjs/common'
import { Public, Resource, Scopes } from 'nest-keycloak-connect'

import { CampaignService } from './campaign.service'
import { CreateCampaignDto } from './dto/create-campaign.dto'

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

  @Post('create-campaign')
  @Public()
  @Scopes()
  async create(@Body() createDto: CreateCampaignDto) {
    console.log(createDto)
    return await this.campaignService.createCampaign(createDto)
  }
}
