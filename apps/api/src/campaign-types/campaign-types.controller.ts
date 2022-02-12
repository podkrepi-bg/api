import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common'
import { Public } from 'nest-keycloak-connect'
import { CampaignTypesService } from './campaign-types.service'

@Controller('campaign-types')
export class CampaignTypesController {
  constructor(private readonly campaignTypesService: CampaignTypesService) {}

  @Post('add')
  @Public()
  async create(
    @Body()
    createCampaignTypeDto: {
      name: string
      slug: string
      description?: string
      parentId?: string
    },
  ) {
    return await this.campaignTypesService.create(createCampaignTypeDto)
  }

  @Get('list')
  @Public()
  async findAll() {
    return await this.campaignTypesService.findAll()
  }

  @Get('view/:id')
  @Public()
  async findOne(@Param('id') id: string) {
    return await this.campaignTypesService.findOne(id)
  }

  @Put('edit/:id')
  @Public()
  async update(
    @Param('id') id: string,
    @Body()
    updateCampaignTypeDto: {
      name: string
      slug: string
      description?: string
      parentId?: string
    },
  ) {
    return await this.campaignTypesService.update(id, updateCampaignTypeDto)
  }

  @Delete('remove/:id')
  @Public()
  async remove(@Param('id') id: string) {
    return await this.campaignTypesService.remove(id)
  }

  @Get('/search/name/:key')
  @Public()
  async searchByName(@Param('key') keyword: string) {
    return await this.campaignTypesService.searchByCategory(keyword)
  }

  @Get('/search/category/:key')
  @Public()
  async searchByCategory(@Param('key') keyword: string) {
    return await this.campaignTypesService.searchByCategory(keyword)
  }

  @Post('deletemany')
  @Public()
  removeMany(@Body() itemsToDelete: [string]) {
    return this.campaignTypesService.removeMany(itemsToDelete)
  }
}
