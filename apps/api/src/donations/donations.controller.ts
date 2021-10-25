import { Public } from 'nest-keycloak-connect'
import { Body, Controller, Get, Post } from '@nestjs/common'

import { DonationsService } from './donations.service'
import { CreateSessionDto } from './dto/create-session.dto'

@Controller('donation')
export class DonationsController {
  constructor(private readonly paymentsService: DonationsService) {}

  @Post('create-checkout-session')
  @Public()
  createCheckoutSession(@Body() sessionDto: CreateSessionDto) {
    return this.paymentsService.createCheckoutSession(sessionDto.priceId, sessionDto.mode)
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
}
