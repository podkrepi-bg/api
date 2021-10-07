import { Campaign } from '.prisma/client'
import { Public } from 'nest-keycloak-connect'
import { Body, Controller, Get, Param, Post } from '@nestjs/common'

import { CampaignService } from './campaign.service'
import { CreateCampaignDto } from './dto/create-campaign.dto'

@Controller('campaign')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Get('list')
  @Public()
  getData() {
    return this.campaignService.listCampaigns()
  }

  @Get(':slug')
  @Public()
  async viewBySlug(@Param('slug') slug: string): Promise<{ campaign: Campaign | null }> {
    const campaign = await this.campaignService.getCampaignBySlug(slug)
    return { campaign }
  }

  @Post('create-campaign')
  @Public()
  async create(@Body() createDto: CreateCampaignDto) {
    console.log(createDto)
    return await this.campaignService.createCampaign(createDto)
  }
}
