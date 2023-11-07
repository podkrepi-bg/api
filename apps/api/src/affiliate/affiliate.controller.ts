import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  DefaultValuePipe,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { PersonService } from '../person/person.service'
import { KeycloakTokenParsed, isAdmin } from '../auth/keycloak'
import { AuthenticatedUser, Public, RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import { AffiliateService } from './affiliate.service'
import { AffiliateStatusUpdateDto } from './dto/affiliate-status-update.dto'
import { CreateAffiliateDonationDto } from './dto/create-affiliate-donation.dto'
import { DonationsService } from '../donations/donations.service'
import { shouldAllowStatusChange } from '../donations/helpers/donation-status-updates'
import { affiliateCodeGenerator } from './utils/affiliateCodeGenerator'
import { DonationStatus } from '@prisma/client'
import { CampaignService } from '../campaign/campaign.service'
import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'

@Controller('affiliate')
@ApiTags('affiliate')
export class AffiliateController {
  constructor(
    private readonly personService: PersonService,
    private readonly affiliateService: AffiliateService,
    private readonly donationService: DonationsService,
    private readonly campaignService: CampaignService,
  ) {}

  @Get('list-all')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  async findAllAffiliates() {
    return await this.affiliateService.findAll()
  }
  @Get('data')
  async findAffiliateByUserId(@AuthenticatedUser() user: KeycloakTokenParsed) {
    const affiliate = await this.affiliateService.getAffiliateDataByKeycloakId(user.sub)
    return affiliate
  }

  @Get(':affiliateCode')
  @Public()
  async affiliateSummary(@Param('affiliateCode') affilliateCode: string) {
    const affiliate = await this.affiliateService.getAffiliateSummaryByCode(affilliateCode)
    if (!affiliate) throw new NotFoundException('Affiliate not found')
    return affiliate
  }

  @Post('join')
  async joinAffiliateProgramRequest(@AuthenticatedUser() user: KeycloakTokenParsed) {
    const person = await this.personService.findOneByKeycloakId(user.sub)
    if (!person) throw new NotFoundException('User is not found')
    if (!person.company) throw new BadRequestException('Must be corporate profile')
    return await this.affiliateService.create(person.company.id)
  }

  @Patch(':affiliateId/status')
  async updateAffiliateStatus(
    @Param('affiliateId') affiliateId: string,
    @Body() { newStatus }: AffiliateStatusUpdateDto,
    @AuthenticatedUser() user: KeycloakTokenParsed,
  ) {
    if (!isAdmin(user)) throw new ForbiddenException('Must be an admin')
    const affiliate = await this.affiliateService.findOneById(affiliateId)

    if (!affiliate) throw new NotFoundException('Affiliate not found')

    let affiliateCode: string | null = affiliate.affiliateCode

    if (affiliate.status === newStatus) {
      throw new ConflictException('Status is the same')
    }

    if (affiliate.status !== 'active' && newStatus === 'active') {
      affiliateCode = affiliateCodeGenerator(affiliate.id)
    }

    if (affiliate.status === 'active' && newStatus !== 'active') {
      affiliateCode = null
    }

    return await this.affiliateService.updateStatus(affiliateId, newStatus, affiliateCode)
  }

  @Patch(':affiliateId/code-refresh')
  async refreshAffiliateCode(
    @Param('affiliateId') affiliateId: string,
    @AuthenticatedUser() user: KeycloakTokenParsed,
  ) {
    if (!isAdmin(user)) throw new ForbiddenException('Must be an admin')
    const affiliateCode = affiliateCodeGenerator(affiliateId)
    return await this.affiliateService.updateCode(affiliateId, affiliateCode)
  }

  @Post(':affiliateCode/donation')
  @Public()
  async createAffiliateDonation(
    @Param('affiliateCode') affiliateCode: string,
    @Body() donation: CreateAffiliateDonationDto,
  ) {
    const affiliate = await this.affiliateService.findOneByCode(affiliateCode)
    if (!affiliate?.company?.person) throw new NotFoundException('Affiliate not found')
    const campaign = await this.campaignService.getCampaignById(donation.campaignId)
    const canAcceptDonation = await this.campaignService.canAcceptDonations(campaign)
    if (!canAcceptDonation) {
      throw new ConflictException('Campaign has been completed already')
    }
    const affiliateDonationDto: CreateAffiliateDonationDto = {
      ...donation,
      affiliateId: affiliate.id,
      personId: donation.isAnonymous ? null : affiliate.company.person.id,
      billingName: affiliate.company.person.firstName + ' ' + affiliate.company.person.lastName,
      billingEmail: affiliate.company.person.email,
      toEntity: donation.toEntity,
    }

    return await this.donationService.createAffiliateDonation(affiliateDonationDto)
  }

  @Get(':affiliateCode/donations')
  @Public()
  async getAffiliateDonations(
    @Param('affiliateCode') affiliateCode: string,
    @Query('status') status: DonationStatus | undefined,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return await this.affiliateService.findAffiliateDonationsWithPagination(
      affiliateCode,
      status,
      page,
      limit,
    )
  }

  @Patch(':affiliateCode/donations/:donationId/cancel')
  @Public()
  async cancelAffiliateDonation(
    @Param('affiliateCode') affiliateCode: string,
    @Param('donationId') donationId: string,
  ) {
    const donation = await this.donationService.getAffiliateDonationById(donationId, affiliateCode)
    if (!donation) {
      throw new NotFoundException('Donation with this id is not found')
    }

    if (!shouldAllowStatusChange(donation.status, 'cancelled'))
      throw new BadRequestException("Donation status can't be updated")

    return await this.donationService.update(donation.id, { status: 'cancelled' })
  }
}
