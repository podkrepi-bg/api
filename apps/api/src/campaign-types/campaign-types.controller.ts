import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common'
import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'
import { RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import { CampaignTypesService } from './campaign-types.service'
import { CreateCampaignTypeDto } from './dto/create-campaign-type.dto'
import { DeleteManyCampaignTypesDto } from './dto/delete-many-campaign-types.dto'
import { UpdateCampaignTypeDto } from './dto/update-campaign-type.dto'

@Controller('campaign-types')
export class CampaignTypesController {
  constructor(private readonly campaignTypesService: CampaignTypesService) {}

  @Post()
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  async create(@Body() createCampaignTypeDto: CreateCampaignTypeDto) {
    return await this.campaignTypesService.create(createCampaignTypeDto)
  }

  @Get()
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  async findAll() {
    return await this.campaignTypesService.findAll()
  }

  @Get(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  async findOne(@Param('id') id: string) {
    return await this.campaignTypesService.findOne(id)
  }

  @Put(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  async update(@Param('id') id: string, @Body() updateCampaignTypeDto: UpdateCampaignTypeDto) {
    return await this.campaignTypesService.update(id, updateCampaignTypeDto)
  }

  @Delete(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  async remove(@Param('id') id: string) {
    return await this.campaignTypesService.remove(id)
  }

  @Post('delete-many')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  async deleteMany(@Body() data: DeleteManyCampaignTypesDto) {
    return await this.campaignTypesService.removeMany(data)
  }
}
