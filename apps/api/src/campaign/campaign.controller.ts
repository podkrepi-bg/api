import { Campaign } from '.prisma/client'
import { AuthenticatedUser, Public, RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  NotFoundException,
} from '@nestjs/common'

import { CampaignService } from './campaign.service'
import { CreateCampaignDto } from './dto/create-campaign.dto'
import { UpdateCampaignDto } from '../campaign/dto/update-campaign.dto'
import { KeycloakTokenParsed, isAdmin } from '../auth/keycloak'
import { PersonService } from '../person/person.service'

@Controller('campaign')
export class CampaignController {
  constructor(
    private readonly campaignService: CampaignService,
    private readonly personService: PersonService,
  ) {}

  @Get('list')
  @Public()
  async getData() {
    return this.campaignService.listCampaigns()
  }

  @Get(':slug')
  @Public()
  async viewBySlug(@Param('slug') slug: string): Promise<{ campaign: Campaign | null }> {
    const campaign = await this.campaignService.getCampaignBySlug(slug)
    return { campaign }
  }

  @Post('create-campaign')
  async create(
    @Body() createDto: CreateCampaignDto,
    @AuthenticatedUser() user: KeycloakTokenParsed,
  ) {
    let person
    if (!isAdmin(user)) {
      person = await this.personService.findOneByKeycloakId(user.sub as string)
      if (!person) {
        throw new NotFoundException('No person found for logged user')
      }
    }

    return await this.campaignService.createCampaign(createDto, person?.id)
  }

  @Get('byId/:id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  async findOne(@Param('id') id: string) {
    return this.campaignService.getCampaignById(id)
  }

  @Get('donations/:id')
  @Public()
  async getDonations(@Param('id') id: string) {
    return await this.campaignService.getDonationsForCampaign(id)
  }

  @Patch(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  async update(@Param('id') id: string, @Body() updateCampaignDto: UpdateCampaignDto) {
    return this.campaignService.update(id, updateCampaignDto)
  }

  @Delete(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  async remove(@Param('id') id: string) {
    return this.campaignService.removeCampaign(id)
  }
}
