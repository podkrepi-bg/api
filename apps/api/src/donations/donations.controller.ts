import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'
import { AuthenticatedUser, Public, RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import { Body, Controller, Get, Param, Patch, Post, UnauthorizedException } from '@nestjs/common'

import { KeycloakTokenParsed } from '../auth/keycloak'
import { DonationsService } from './donations.service'
import { CreateSessionDto } from './dto/create-session.dto'
import { CreatePaymentDto } from './dto/create-payment.dto'
import { UpdatePaymentDto } from './dto/update-payment.dto'
import { CreateBankPaymentDto } from './dto/create-bank-payment.dto'

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

  @Get('list')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  findAll() {
    return this.donationsService.listDonations()
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.donationsService.getDonationById(id)
  }

  @Get('user/:id')
  userDonationById(@Param('id') id: string, @AuthenticatedUser() user: KeycloakTokenParsed) {
    return this.donationsService.getUserDonationById(id, user.sub as string)
  }

  @Post('create-payment')
  create(
    @AuthenticatedUser()
    user: KeycloakTokenParsed,
    @Body()
    createPaymentDto: CreatePaymentDto,
  ) {
    if (!user) {
      throw new UnauthorizedException()
    }

    return this.donationsService.create(createPaymentDto, user)
  }

  @Post('create-bank-payment')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  createBankPayment(
    @Body()
    bankPaymentDto: CreateBankPaymentDto,
  ) {
    return this.donationsService.createBankPayment(bankPaymentDto)
  }

  @Patch(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  update(
    @Param('id')
    id: string,
    @Body()
    updatePaymentDto: UpdatePaymentDto,
  ) {
    return this.donationsService.update(id, updatePaymentDto)
  }

  @Post('delete')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  delete(
    @Body()
    idsToDelete: string[],
  ) {
    return this.donationsService.softDelete(idsToDelete)
  }
}
