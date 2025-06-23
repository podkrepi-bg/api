import { Campaign, CampaignState } from '@prisma/client'
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
  ForbiddenException,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common'

import { CampaignService } from './campaign.service'
import { CreateCampaignDto } from './dto/create-campaign.dto'
import { UpdateCampaignDto } from '../campaign/dto/update-campaign.dto'
import { KeycloakTokenParsed, isAdmin } from '../auth/keycloak'
import { PersonService } from '../person/person.service'
import { ApiQuery } from '@nestjs/swagger'
import { DonationQueryDto } from '../common/dto/donation-query-dto'
import { ApiTags } from '@nestjs/swagger'
import { CampaignNewsService } from '../campaign-news/campaign-news.service'
import { CampaignSubscribeDto } from './dto/campaign-subscribe.dto'

@ApiTags('campaign')
@Controller('campaign')
export class CampaignController {
  constructor(
    private readonly campaignService: CampaignService,
    private readonly campaignNewsService: CampaignNewsService,
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

  @Get('get-user-campaigns')
  async findUserCampaigns(@AuthenticatedUser() user: KeycloakTokenParsed) {
    return this.campaignService.getUserCampaigns(user.sub)
  }

  @Get('user-donations-campaigns')
  async getUserDonatedCampaigns(@AuthenticatedUser() user: KeycloakTokenParsed) {
    return await this.campaignService.getUserDonatedCampaigns(user.sub)
  }

  @Get('news')
  @Public()
  async listPublishedNews(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number) {
    return this.campaignNewsService.listPublishedNewsWithPagination(page)
  }

  @Get(':slug')
  @Public()
  async viewBySlug(@Param('slug') slug: string): Promise<{ campaign: Campaign | null }> {
    const campaign = await this.campaignService.getCampaignBySlug(slug)
    return { campaign }
  }

  @Get(':slug/can-edit')
  async canEditCampaign(
    @Param('slug') slug: string,
    @AuthenticatedUser() user: KeycloakTokenParsed,
  ): Promise<boolean> {
    const campaign = await this.campaignService.isUserCampaign(user.sub, slug)
    return campaign
  }

  @Get(':slug/news')
  @Public()
  async listNewsForSingleCampaign(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Param(`slug`) slug: string,
  ) {
    return this.campaignNewsService.findArticlesByCampaignSlugWithPagination(slug, page)
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
  @Public()
  async findOne(@Param('id') id: string) {
    return await this.campaignService.getCampaignById(id)
  }

  @Get('donations/:id')
  @ApiQuery({ name: 'pageindex', required: false, type: Number })
  @ApiQuery({ name: 'pagesize', required: false, type: Number })
  @Public()
  async getDonations(@Param('id') id: string, @Query() query?: DonationQueryDto) {
    return await this.campaignService.getDonationsForCampaign(id, query?.pageindex, query?.pagesize)
  }

  @Patch(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  async update(
    @Param('id') id: string,
    @Body() updateCampaignDto: UpdateCampaignDto,
    @AuthenticatedUser() user: KeycloakTokenParsed,
  ) {
    const campaign = await this.campaignService.getCampaignByIdWithPersonIds(id)
    if (
      user.sub === campaign?.beneficiary.person?.keycloakId ||
      user.sub === campaign?.organizer?.person.keycloakId ||
      user.sub === campaign?.coordinator.person.keycloakId ||
      isAdmin(user)
    )
      return this.campaignService.update(id, updateCampaignDto, campaign)
    else
      throw new ForbiddenException(
        'The user is not coordinator,organizer or beneficiery to the requested campaign',
      )
  }

  @Post(':id/subscribe')
  @Public()
  async subscribeToCampaignNotifications(
    @Param('id') id: string,
    @Body() data: CampaignSubscribeDto,
  ) {
    if (data.consent === false)
      throw new BadRequestException('Notification consent should be provided')
    // Subscribe to campaign notifications list
    await this.campaignService.subscribeToCampaignNotification(id, data)
    
    return { message: 'Success' }
  }

  @Delete(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  async remove(@Param('id') id: string) {
    return this.campaignService.removeCampaign(id)
  }

  @Get(':slug/expenses')
  async listCampaignExpenses(
    @Param('slug') slug: string,
    @AuthenticatedUser() user: KeycloakTokenParsed,
  ) {
    const campaign = await this.campaignService.getCampaignBySlug(slug)
    if (!campaign) {
      throw new NotFoundException('Campaign not found')
    }
    if (!isAdmin(user)) {
      await this.campaignService.checkCampaignOwner(user.sub, campaign.id)
    }

    return this.campaignService.listExpenses(slug)
  }

  @Get(':slug/expenses/approved')
  @Public()
  async listCampaignExpensesApproved(@Param('slug') slug: string) {
    return this.campaignService.listExpensesApproved(slug)
  }
}
