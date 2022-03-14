import { AuthenticatedUser, Public } from 'nest-keycloak-connect'
import { Body, Controller, Get, Post } from '@nestjs/common'

import { DonationsService } from './donations.service'
import { CreateSessionDto } from './dto/create-session.dto'
import { KeycloakTokenParsed } from '../auth/keycloak'

@Controller('donation')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Post('create-checkout-session')
  @Public()
  createCheckoutSession(@Body() sessionDto: CreateSessionDto) {
    return this.donationsService.createCheckoutSession(sessionDto)
  }

  @Get('prices')
  @Public()
  findPrices() {
    return this.donationsService.listPrices()
  }

  @Get('prices/single')
  @Public()
  findSinglePrices() {
    return this.donationsService.listPrices('one_time')
  }

  @Get('prices/recurring')
  @Public()
  findRecurringPrices() {
    return this.donationsService.listPrices('recurring')
  }

  @Get('user-donations')
  async userDonations(@AuthenticatedUser() user: KeycloakTokenParsed) {
    return await this.donationsService.getDonationsByUser(user.sub as string)
  }
}
