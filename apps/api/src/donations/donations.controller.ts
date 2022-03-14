import { AuthenticatedUser, Public } from 'nest-keycloak-connect'
import { Body, Controller, Get, Post } from '@nestjs/common'

import { DonationsService } from './donations.service'
import { CreateSessionDto } from './dto/create-session.dto'
import { KeycloakTokenParsed } from '../auth/keycloak'
import { AccountService } from '../account/account.service'

@Controller('donation')
export class DonationsController {
  constructor(private readonly paymentsService: DonationsService, private readonly accountService: AccountService) {}

  @Post('create-checkout-session')
  @Public()
  createCheckoutSession(@Body() sessionDto: CreateSessionDto) {
    return this.paymentsService.createCheckoutSession(sessionDto)
  }

  @Get('prices')
  @Public()
  findPrices() {
    return this.paymentsService.listPrices()
  }

  @Get('prices/single')
  @Public()
  findSinglePrices() {
    return this.paymentsService.listPrices('one_time')
  }

  @Get('prices/recurring')
  @Public()
  findRecurringPrices() {
    return this.paymentsService.listPrices('recurring')
  }

  @Get('user-donations')
  async userDonations(@AuthenticatedUser() user: KeycloakTokenParsed) {
    return await this.paymentsService.getDonationsByUser(user.sub as string)
  }
}
