import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common'
import { CampaignFileService } from './campaign-file.service'
import { CreateCampaignFileDto } from './dto/create-campaign-file.dto'
import { Public } from 'nest-keycloak-connect'
import { Logger, LogLevel, VersioningType } from '@nestjs/common'

@Controller('campaign-file')
export class CampaignFileController {
  constructor(private readonly campaignFileService: CampaignFileService) {}

  @Post()
  @Public()
  create(@Body() createCampaignFileDto: CreateCampaignFileDto) {
    console.log('hmm')
    Logger.log('hmm')
    return this.campaignFileService.create(createCampaignFileDto)
  }

  @Get(':campaign_id')
  @Public()
  findAll(@Param('campaign_id') campaignId: string) {
    Logger.log('hmm')
    return this.campaignFileService.findAll(campaignId)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.campaignFileService.findOne(id)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.campaignFileService.remove(id)
  }
}
