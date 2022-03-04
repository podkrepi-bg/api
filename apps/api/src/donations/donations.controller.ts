import { AuthenticatedUser, Public } from 'nest-keycloak-connect'
import { Body, Controller, Delete, Get, Param, Patch, Post, UnauthorizedException } from '@nestjs/common'

import { DonationsService } from './donations.service'
import { CreateSessionDto } from './dto/create-session.dto'
import { CreatePaymentDto } from './dto/create-payment.dto'
import { KeycloakTokenParsed } from '../auth/keycloak'
import { UpdatePaymentDto } from './dto/update-payment.dto'


@Controller('donation')
export class DonationsController {
  constructor(private readonly paymentsService: DonationsService) {}

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

  @Get('list')
  @Public()
  findAll() {
    return this.paymentsService.listDonations()
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.paymentsService.getDonationById(id)
  }

  @Post('create-payment')
  @Public()
  create(
    // @AuthenticatedUser()
    // user: KeycloakTokenParsed,
    @Body()
    createPaymentDto: CreatePaymentDto,
  ) {
    // if (!user) {
    //   throw new UnauthorizedException()
    // }

    return this.paymentsService.create(createPaymentDto)
  }

  @Patch(':id')
  update(
    @AuthenticatedUser()
    user: KeycloakTokenParsed,
    @Param('id')
    id: string,
    @Body() 
    updatePaymentDto: UpdatePaymentDto,
  ) {
    if (!user) {
      throw new UnauthorizedException()
    }

    return this.paymentsService.update(id, updatePaymentDto)
  }

  @Delete(':id')
  remove(
    @AuthenticatedUser()
    user: KeycloakTokenParsed,
    @Body() 
    idsToDelete: string[],
  ) {
    if (!user) {
      throw new UnauthorizedException()
    }

    return this.paymentsService.remove(idsToDelete)
  }

}
