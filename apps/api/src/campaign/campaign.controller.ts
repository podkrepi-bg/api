import { Campaign } from '.prisma/client'
import { Public } from 'nest-keycloak-connect'
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'

import { CampaignService } from './campaign.service'
import { CreateCampaignDto } from './dto/create-campaign.dto'
import { UpdateCampaignDto } from '../campaign/dto/update-campaign.dto'

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


  @Get('byId/:id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.campaignService.getCampaignById(id)
  }

  @Post('create-campaign')
  @Public()
  async create(@Body() createDto: CreateCampaignDto) {
    return await this.campaignService.createCampaign(createDto)
  }

  @Patch(':id')
  @Public()
  update(@Param('id') id: string, @Body() updateCampaignDto: UpdateCampaignDto) {
    return this.campaignService.update(id, updateCampaignDto)
  }

  @Delete(':id')
  @Public()
  remove(@Param('id') id: string) {
    return this.campaignService.removeCampaign(id)
  }

  @Post('deletemany')
  @Public()
  removeMany(@Body() itemsToDelete: string[]) {
    return this.campaignService.removeMany(itemsToDelete)
  }
}
