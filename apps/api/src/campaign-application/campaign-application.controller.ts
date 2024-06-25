import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common'
import { CampaignApplicationService } from './campaign-application.service'
import { CreateCampaignApplicationDto } from './dto/create-campaign-application.dto'
import { UpdateCampaignApplicationDto } from './dto/update-campaign-application.dto'
import { ApiTags } from '@nestjs/swagger'
import { AuthenticatedUser, Public, RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'
import { KeycloakTokenParsed, isAdmin } from '../auth/keycloak'

@ApiTags('campaign-application')
@Controller('campaign-application')
export class CampaignApplicationController {
  constructor(private readonly campaignApplicationService: CampaignApplicationService) {}

  @Post('create')
  @Public()
  create(@Body() createCampaignApplicationDto: CreateCampaignApplicationDto) {
    return this.campaignApplicationService.create(createCampaignApplicationDto)
  }

  @Get('list')
  findAll() {
    return this.campaignApplicationService.findAll()
  }

  @Get('byId/:id')
  findOne(@Param('id') id: string) {
    return this.campaignApplicationService.findOne(id)
  }

  @Patch(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  async update(
    @Param('id') id: string,
    @Body() updateCampaignApplicationDto: UpdateCampaignApplicationDto,
    @AuthenticatedUser() user: KeycloakTokenParsed,
  ) {
    return this.campaignApplicationService.update(id, updateCampaignApplicationDto)
  }
}
