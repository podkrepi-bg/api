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
} from '@nestjs/common'
import { ApiQuery, ApiTags } from '@nestjs/swagger'
import { AuthenticatedUser, Public, RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'
import { isAdmin, KeycloakTokenParsed } from '../auth/keycloak'
import { DonationsService } from './donations.service'
import { CreateSessionDto } from './dto/create-session.dto'
import { CreatePaymentDto } from './dto/create-payment.dto'
import { UpdatePaymentDto } from './dto/update-payment.dto'
import { CreateBankPaymentDto } from './dto/create-bank-payment.dto'
import { DonationStatus, DonationType } from '@prisma/client'
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto'
import { DonationQueryDto } from '../common/dto/donation-query-dto'

@ApiTags('donation')
@Controller('donation')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Get('export-excel')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  async exportToExcel(@Res() res: Response, @AuthenticatedUser() user: KeycloakTokenParsed) {
    if (isAdmin(user)) {
      await this.donationsService.exportToExcel(res)
    }
  }

  @Post('create-checkout-session')
  @Public()
  async createCheckoutSession(@Body() sessionDto: CreateSessionDto) {
    if (sessionDto.mode === 'subscription' && (sessionDto.personId === null || sessionDto.personId.length === 0)) {
      // in case of a intermediate (step 2) login, we might end up with no personId
      // not able to fetch the current logged user here (due to @Public())
      sessionDto.personId = await this.donationsService.getUserId(sessionDto.personEmail)
    }

    if (sessionDto.mode == 'subscription' && (sessionDto.personId == null || sessionDto.personId.length == 0)) {
      Logger.error(`No personId found for email ${sessionDto.personEmail}. Unable to create a checkout session for a recurring donation`)
      throw new UnauthorizedException("You must be logged in to create a recurring donation")
    }

    Logger.debug(`Creating checkout session with data ${JSON.stringify(sessionDto)}`)

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
    return await this.donationsService.getDonationsByUser(user.sub)
  }

  @Get('listPublic')
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
  @ApiQuery({ name: 'campaignId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'pageindex', required: false, type: Number })
  @ApiQuery({ name: 'pagesize', required: false, type: Number })
  @ApiQuery({ name: 'from', required: false, type: Date })
  @ApiQuery({ name: 'to', required: false, type: Date })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(@Query() query?: DonationQueryDto) {
    return this.donationsService.listDonations(
      query?.campaignId,
      query?.status,
      query?.type,
      query?.from,
      query?.to,
      query?.search,
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
  userDonationById(@Param('id') id: string, @AuthenticatedUser() user: KeycloakTokenParsed) {
    return this.donationsService.getUserDonationById(id, user.sub)
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

  @Post('create-payment-intent')
  @Public()
  createPaymentIntent(
    @Body()
    createPaymentIntentDto: CreatePaymentIntentDto,
  ) {
    return this.donationsService.createPaymentIntent(createPaymentIntentDto)
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
