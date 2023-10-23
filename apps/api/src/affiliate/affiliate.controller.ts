import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { PersonService } from '../person/person.service'
import { KeycloakTokenParsed, isAdmin } from '../auth/keycloak'
import { AuthenticatedUser, Public } from 'nest-keycloak-connect'
import { AffiliateService } from './affiliate.service'
import { AffiliateStatusUpdateDto } from './dto/affiliate-status-update.dto'
import { CreateAffiliateDonation } from './dto/create-affiliate-donation.dto'
import { DonationsService } from '../donations/donations.service'
import { CancelAffiliateDonation } from './dto/cancel-affiliate-donation.dto'
import { shouldAllowStatusChange } from '../donations/helpers/donation-status-updates'
import { affiliateCodeGenerator } from './utils/affiliateCodeGenerator'

@Controller('affiliate')
@ApiTags('affiliate')
export class AffiliateController {
  constructor(
    private readonly personService: PersonService,
    private readonly affiliateService: AffiliateService,
    private readonly donationService: DonationsService,
  ) {}

  @Post('join')
  async joinAffiliateProgramRequest(@AuthenticatedUser() user: KeycloakTokenParsed) {
    const person = await this.personService.findOneByKeycloakId(user.sub)
    if (!person) throw new NotFoundException('User is not found')
    if (!person.company) throw new BadRequestException('Must be corporate profile')
    return await this.affiliateService.create(person.company.id)
  }

  @Patch(':affiliateId/status-update')
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

  @Get(':affiliateCode')
  @Public()
  async affiliateSummary(@Param('affiliateCode') affilliateCode: string) {
    return await this.affiliateService.findOneByCode(affilliateCode)
  }

  @Post(':affiliateCode/donations/create')
  @Public()
  async createAffiliateDonation(
    @Param('affiliateCode') affiliateCode: string,
    @Body() donation: CreateAffiliateDonation,
  ) {
    const affiliate = await this.affiliateService.findOneByCode(affiliateCode)
    if (!affiliate || !affiliate.company || !affiliate.company.person)
      throw new NotFoundException('Affiliate not found')

    const affiliateDonationDto: CreateAffiliateDonation = {
      ...donation,
      affiliateId: affiliate.id,
      personId: donation.isAnonymous ? null : affiliate.company.person.id,
      billingEmail: affiliate.company.person.email,
      toEntity: donation.toEntity,
    }

    return await this.donationService.createAffiliateDonation(affiliateDonationDto)
  }

  @Patch(':affiliateCode/donations/cancel')
  @Public()
  async cancelAffiliateDonation(
    @Param('affiliateCode') affiliateCode: string,
    @Body() donationDto: CancelAffiliateDonation,
  ) {
    const donation = await this.donationService.getAffiliateDonationById(
      donationDto.donationId,
      affiliateCode,
    )
    if (!donation) throw new NotFoundException('Donation with this id is not found')

    if (!shouldAllowStatusChange(donation.status, 'cancelled'))
      throw new BadRequestException("Donation status can't be updated")

    return await this.donationService.update(donation.id, { status: 'cancelled' })
  }
}
