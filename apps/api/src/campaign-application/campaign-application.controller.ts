import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common'
import { CampaignApplicationService } from './campaign-application.service'
import { CreateCampaignApplicationDto } from './dto/create-campaign-application.dto'
import { UpdateCampaignApplicationDto } from './dto/update-campaign-application.dto'

@Controller('campaign-application')
export class CampaignApplicationController {
  constructor(private readonly campaignApplicationService: CampaignApplicationService) {}

  @Post()
  create(@Body() createCampaignApplicationDto: CreateCampaignApplicationDto) {
    return this.campaignApplicationService.create(createCampaignApplicationDto)
  }

  @Get()
  findAll() {
    return this.campaignApplicationService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.campaignApplicationService.findOne(id)
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCampaignApplicationDto: UpdateCampaignApplicationDto,
  ) {
    return this.campaignApplicationService.update(id, updateCampaignApplicationDto)
  }
}
