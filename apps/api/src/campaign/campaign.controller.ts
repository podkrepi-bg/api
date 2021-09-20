import { Campaign } from '.prisma/client'
import { Body, Controller, Get, Param, Post } from '@nestjs/common'
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

  @Get(':slug')
  @Public()
  @Scopes('view')
  async viewBySlug(@Param('slug') slug: string): Promise<{ campaign: Campaign | null }> {
    const campaign = await this.campaignService.getCampaignBySlug(slug)
    return { campaign }
  }

  @Post('create-campaign')
  @Public()
  @Scopes()
  async create(@Body() createDto: CreateCampaignDto) {
    console.log(createDto)
    return await this.campaignService.createCampaign(createDto)
  }
}
