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

import { AuthenticatedUser, Public, RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import {
  RealmViewSupporters,
  ViewSupporters,
  EditFinancialsRequests,
} from '@podkrepi-bg/podkrepi-types'

import { isAdmin, KeycloakTokenParsed } from '../auth/keycloak'
import { DonationsService } from './donations.service'
import { CreateSessionDto } from './dto/create-session.dto'
import { UpdatePaymentDto } from './dto/update-payment.dto'
import { UpdateDonationDto } from './dto/update-donation.dto'
import { CreateBankPaymentDto } from './dto/create-bank-payment.dto'
import { UpdatePaymentIntentDto } from './dto/update-payment-intent.dto'
import { CreateStripePaymentDto } from './dto/create-stripe-payment.dto'
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto'
import { DonationQueryDto } from '../common/dto/donation-query-dto'
import { CancelPaymentIntentDto } from './dto/cancel-payment-intent.dto'
import { DonationsApiQuery } from './queries/donations.apiquery'
import { PersonService } from '../person/person.service'
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager'
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

  @Get('user-donations')
  async userDonations(@AuthenticatedUser() user: KeycloakTokenParsed) {
    return await this.donationsService.getDonationsByUser(user.sub, user.email)
  }

  @Get('money')
  @CacheTTL(5 * 1000)
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
  @CacheTTL(2 * 1000)
  @Public()
  @ApiQuery({ name: 'campaignId', required: false, type: String })
  @ApiQuery({ name: 'pageindex', required: false, type: Number })
  @ApiQuery({ name: 'pagesize', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, type: String })
  findAllPublic(@Query('campaignId') campaignId?: string, @Query() query?: DonationQueryDto) {
    return this.donationsService.listDonationsPublic(
      campaignId,
      query?.status,
      query?.pageindex,
      query?.pagesize,
      query?.sortBy,
      query?.sortOrder,
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
      query?.paymentId,
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

  @Get('payments')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  async paymentsList(
    @AuthenticatedUser() user: KeycloakTokenParsed,
    @Query() query: DonationQueryDto,
  ) {
    return await this.donationsService.listPayments(
      query?.paymentId,
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

  @Get('payments/:id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  findOne(@Param('id') paymentId: string) {
    return this.donationsService.getPaymentById(paymentId)
  }

  @Get('payment-intent')
  @Public()
  async findDonationByPaymentIntent(@Query('id') paymentIntentId: string) {
    return await this.donationsService.getDonationByPaymentIntent(paymentIntentId)
  }

  @Get('user/:id')
  async userDonationById(@Param('id') id: string, @AuthenticatedUser() user: KeycloakTokenParsed) {
    const donation = await this.donationsService.getUserDonationById(id, user.sub, user.email)
    return donation
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

  @Patch('/:id/invalidate')
  @Roles({
    roles: [EditFinancialsRequests.role],
    mode: RoleMatchingMode.ANY,
  })
  invalidate(@Param('id') id: string) {
    Logger.debug(`Invalidating donation with id ${id}`)
    return this.donationsService.invalidate(id)
  }

  @Patch(':id/type')
  @Roles({
    roles: [EditFinancialsRequests.role],
    mode: RoleMatchingMode.ANY,
  })
  updateDonationType(
    @Param('id') id: string,
    @Body() updateDonationDto: UpdateDonationDto,
  ) {
    Logger.debug(`Updating donation type for donation with id ${id}`)
    return this.donationsService.updateDonationType(id, updateDonationDto.type)
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
    Logger.debug(`Updating donation with id ${id}`)

    return this.donationsService.update(id, updatePaymentDto)
  }

  @Patch(':id/sync-with-payment')
  @Roles({
    roles: [EditFinancialsRequests.role],
    mode: RoleMatchingMode.ANY,
  })
  async syncWithPayment(@Param('id') donationId: string) {
    return await this.donationsService.syncDonationAmountWithPayment(donationId)
  }
  @Post('delete')
  @Roles({
    roles: [EditFinancialsRequests.role],
    mode: RoleMatchingMode.ANY,
  })
  delete(
    @Body()
    idsToDelete: string[],
  ) {
    return this.donationsService.softDelete(idsToDelete)
  }
}
