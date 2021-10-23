import { Controller, Get } from '@nestjs/common'
import { Public } from 'nest-keycloak-connect'
import { DonationsService } from './donations.service'

@Controller('donation')
export class DonationsController {
  constructor(private readonly paymentsService: DonationsService) {}

  @Get()
  @Public()
  findPrices() {
    return this.paymentsService.listPrices()
  }

  @Get('single')
  @Public()
  findSinglePrices() {
    return this.paymentsService.listPrices('one_time')
  }

  @Get('recurring')
  @Public()
  findRecurringPrices() {
    return this.paymentsService.listPrices('recurring')
  }
}
