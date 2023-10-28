import { Response } from 'express'
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UnauthorizedException,
  Query,
  Logger,
  Res,
  Inject,
  forwardRef,
} from '@nestjs/common'
import { ApiQuery, ApiTags } from '@nestjs/swagger'
import { DonationStatus } from '@prisma/client'
import { AuthenticatedUser, Public, RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'

import { isAdmin, KeycloakTokenParsed } from '../auth/keycloak'
import { DonationsService } from './donations.service'
import { CreateSessionDto } from './dto/create-session.dto'
import { UpdatePaymentDto } from './dto/update-payment.dto'
import { CreateBankPaymentDto } from './dto/create-bank-payment.dto'
import { UpdatePaymentIntentDto } from './dto/update-payment-intent.dto'
import { CreateStripePaymentDto } from './dto/create-stripe-payment.dto'
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto'
import { DonationQueryDto } from '../common/dto/donation-query-dto'
import { CancelPaymentIntentDto } from './dto/cancel-payment-intent.dto'
import { DonationsApiQuery } from './queries/donations.apiquery'
import { PersonService } from '../person/person.service'
import { CacheInterceptor } from '@nestjs/cache-manager'
import { UseInterceptors } from '@nestjs/common'

@ApiTags('donation')
@Controller('donation')
export class DonationsController {
  constructor(
    private readonly donationsService: DonationsService,
    @Inject(forwardRef(() => PersonService)) private readonly personService: PersonService,
  ) {}

  @Get('export-excel')
  @DonationsApiQuery()
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  async exportToExcel(
    @AuthenticatedUser() user: KeycloakTokenParsed,
    @Query() query: DonationQueryDto,
    @Res() response: Response,
  ) {
    if (isAdmin(user)) {
      await this.donationsService.exportToExcel(query, response)
    }
  }

  @Post('create-checkout-session')
  @Public()
  async createCheckoutSession(@Body() sessionDto: CreateSessionDto) {
    if (
      sessionDto.mode === 'subscription' &&
      (sessionDto.personId === null || sessionDto.personId.length === 0)
    ) {
      // in case of a intermediate (step 2) login, we might end up with no personId
      // not able to fetch the current logged user here (due to @Public())
      sessionDto.personId = await this.donationsService.getUserId(sessionDto.personEmail)
    }

    if (
      sessionDto.mode == 'subscription' &&
      (sessionDto.personId == null || sessionDto.personId.length == 0)
    ) {
      Logger.error(
        `No personId found for email ${sessionDto.personEmail}. Unable to create a checkout session for a recurring donation`,
      )
      throw new UnauthorizedException('You must be logged in to create a recurring donation')
    }

    Logger.debug(`Creating checkout session with data ${JSON.stringify(sessionDto)}`)

    return this.donationsService.createCheckoutSession(sessionDto)
  }

  @Get('prices')
  @UseInterceptors(CacheInterceptor)
  @Public()
  findPrices() {
    return this.donationsService.listPrices()
  }

  @Get('prices/single')
  @UseInterceptors(CacheInterceptor)
  @Public()
  findSinglePrices() {
    return this.donationsService.listPrices('one_time')
  }

  @Get('prices/recurring')
  @UseInterceptors(CacheInterceptor)
  @Public()
  findRecurringPrices() {
    return this.donationsService.listPrices('recurring')
  }

  @Get('user-donations')
  async userDonations(@AuthenticatedUser() user: KeycloakTokenParsed) {
    return await this.donationsService.getDonationsByUser(user.sub, user.email)
  }

  @Get('money')
  @UseInterceptors(CacheInterceptor)
  @Public()
  async totalDonatedMoney() {
    return this.donationsService.getTotalDonatedMoney()
  }

  @Get('donors-count')
  @UseInterceptors(CacheInterceptor)
  @Public()
  async donorsCount() {
    return await this.donationsService.getDonorsCount()
  }

  @Get('listPublic')
  @UseInterceptors(CacheInterceptor)
  @Public()
  @ApiQuery({ name: 'campaignId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: DonationStatus })
  @ApiQuery({ name: 'pageindex', required: false, type: Number })
  @ApiQuery({ name: 'pagesize', required: false, type: Number })
  findAllPublic(
    @Query('campaignId') campaignId?: string,
    @Query('status') status?: DonationStatus,
    @Query() query?: DonationQueryDto,
  ) {
    return this.donationsService.listDonationsPublic(
      campaignId,
      status,
      query?.pageindex,
      query?.pagesize,
    )
  }

  @Get('list')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  @DonationsApiQuery()
  findAll(@Query() query: DonationQueryDto) {
    return this.donationsService.listDonations(
      query?.campaignId,
      query?.status,
      query?.provider,
      query?.minAmount,
      query?.maxAmount,
      query?.from,
      query?.to,
      query?.search,
      query?.sortBy,
      query?.sortOrder,
      query?.pageindex,
      query?.pagesize,
    )
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.donationsService.getDonationById(id)
  }

  @Get('user/:id')
  async userDonationById(@Param('id') id: string, @AuthenticatedUser() user: KeycloakTokenParsed) {
    return await this.donationsService.getUserDonationById(id, user.sub, user.email)
  }

  @Post('payment-intent')
  @Public()
  createPaymentIntent(
    @Body()
    createPaymentIntentDto: CreatePaymentIntentDto,
  ) {
    return this.donationsService.createPaymentIntent(createPaymentIntentDto)
  }

  @Post('payment-intent/:id')
  @Public()
  updatePaymentIntent(
    @Param('id') id: string,
    @Body()
    updatePaymentIntentDto: UpdatePaymentIntentDto,
  ) {
    return this.donationsService.updatePaymentIntent(id, updatePaymentIntentDto)
  }

  @Post('payment-intent/:id/cancel')
  @Public()
  cancelPaymentIntent(
    @Param('id') id: string,
    @Body()
    cancelPaymentIntentDto: CancelPaymentIntentDto,
  ) {
    return this.donationsService.cancelPaymentIntent(id, cancelPaymentIntentDto)
  }

  @Post('create-stripe-payment')
  @Public()
  createStripePayment(
    @Body()
    stripePaymentDto: CreateStripePaymentDto,
  ) {
    return this.donationsService.createStripePayment(stripePaymentDto)
  }

  @Post('/refund-stripe-payment/:id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  refundStripePaymet(@Param('id') paymentIntentId: string) {
    return this.donationsService.refundStripePayment(paymentIntentId)
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
    return this.donationsService.createUpdateBankPayment(bankPaymentDto)
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
