import { Campaign, CampaignState } from '.prisma/client'
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
  forwardRef,
  Inject,
  Logger,
  BadRequestException,
  Query,
} from '@nestjs/common'

import { CampaignService } from './campaign.service'
import { CreateCampaignDto } from './dto/create-campaign.dto'
import { UpdateCampaignDto } from '../campaign/dto/update-campaign.dto'
import { KeycloakTokenParsed, isAdmin } from '../auth/keycloak'
import { PersonService } from '../person/person.service'
import { ApiQuery } from '@nestjs/swagger'
import { PagingQueryDto } from '../common/dto/paging-query-dto'
@Controller('campaign')
export class CampaignController {
  constructor(
    private readonly campaignService: CampaignService,
    @Inject(forwardRef(() => PersonService)) private readonly personService: PersonService,
  ) {}

  @Get('list')
  @Public()
  async getData() {
    return this.campaignService.listCampaigns()
  }

  @Get('list-all')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  async getAdminList() {
    return this.campaignService.listAllCampaigns()
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
    if (createDto.state && createDto.state != CampaignState.draft) {
      const message =
        "Can't create campaign in state different than draft. Not allowed state value received: " +
        createDto.state
      Logger.error(message)
      throw new BadRequestException(message)
    }

    if (!isAdmin(user)) {
      Logger.warn('The campaign creator is not in admin role. User name is: ' + user.name)
    }

    let person
    if (!createDto.coordinatorId) {
      //Find the creator personId and make him a coordinator
      person = await this.personService.findOneByKeycloakId(user.sub)

      if (!person) {
        Logger.error('No person found in database for logged user: ' + user.name)
        throw new NotFoundException('No person found for logged user: ' + user.name)
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
  @ApiQuery({ name: 'pageindex', required: false, type: Number })
  @ApiQuery({ name: 'pagesize', required: false, type: Number })
  @Public()
  async getDonations(@Param('id') id: string, @Query() query?: PagingQueryDto) {
    return await this.campaignService.getDonationsForCampaign(id, query?.pageindex, query?.pagesize)
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
