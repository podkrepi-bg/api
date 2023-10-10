import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { PersonService } from '../person/person.service'
import { KeycloakTokenParsed, isAdmin } from '../auth/keycloak'
import { AuthenticatedUser } from 'nest-keycloak-connect'
import { AffiliateService } from './affiliate.service'
import { AffiliateStatusUpdateDto } from './dto/affiliate-status-update.dto'
import { getPaymentReference } from '../campaign/helpers/payment-reference'

@Controller('affiliate')
@ApiTags('affiliate')
export class AffiliateController {
  constructor(
    private readonly personService: PersonService,
    private readonly affiliateService: AffiliateService,
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
    if (!isAdmin(user)) throw new ForbiddenException('Must be an admin ')
    const affiliate = await this.affiliateService.findOneById(affiliateId)

    if (!affiliate) throw new NotFoundException('Affiliate not found')

    if (affiliate.status === newStatus) {
      throw new ConflictException('Status is the same')
    }

    if (affiliate.status === 'pending' && newStatus === 'active') {
      const affiliateCode = getPaymentReference()
      return await this.affiliateService.updateStatus(affiliateId, newStatus, affiliateCode)
    }

    return await this.affiliateService.updateStatus(affiliateId, newStatus, affiliate.affiliateCode)
  }
}
