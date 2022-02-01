import { Campaign } from '.prisma/client'
import { Public } from 'nest-keycloak-connect'
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'

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
    return await this.campaignService.createCampaign(createDto)
  }

  @Patch(':id')
  @Public()
  async edit(@Param('id') campaignId: string, @Body() createDto: CreateCampaignDto) {
    //  this.campaignService.editCampaign(createDto);
    return null
  }

  @Delete(':id')
  removeCamp(@Param('id') campId: string) {
    this.campaignService.deleteCamp(campId)
    return null
  }
}
