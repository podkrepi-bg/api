import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common'
import { Public } from 'nest-keycloak-connect'
import { CampaignDocumentRoleService } from './campaign-document-role.service'
import { CreateCampaignDocumentRoleDto } from './dto/create-campaign-document-role.dto'
import { UpdateCampaignDocumentRoleDto } from './dto/update-campaign-document-role.dto'

@Controller('campaign-document-role')
export class CampaignDocumentRoleController {
  constructor(private readonly campaignDocumentRoleService: CampaignDocumentRoleService) {}

  @Post()
  create(@Body() createCampaignDocumentRoleDto: CreateCampaignDocumentRoleDto) {
    return this.campaignDocumentRoleService.create(createCampaignDocumentRoleDto)
  }

  @Get()
  @Public()
  findAll() {
    return this.campaignDocumentRoleService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.campaignDocumentRoleService.findOne(id)
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCampaignDocumentRoleDto: UpdateCampaignDocumentRoleDto,
  ) {
    return this.campaignDocumentRoleService.update(id, updateCampaignDocumentRoleDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.campaignDocumentRoleService.remove(id)
  }

  @Post('delete-many')
  removeMany(@Body() tasksToDelete: [string]) {
    return this.campaignDocumentRoleService.removeMany(tasksToDelete)
  }
}
