import {
  Body,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  UnauthorizedException,
} from '@nestjs/common'
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AuthenticatedUser, Public, RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import { CancelPaymentIntentDto } from './dto/cancel-payment-intent.dto'
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto'
import { UpdatePaymentIntentDto } from './dto/update-payment-intent.dto'
import { UpdateSetupIntentDto } from './dto/update-setup-intent.dto'
import { StripeService } from './stripe.service'
import { EditFinancialsRequests } from '@podkrepi-bg/podkrepi-types'
import { CreateSessionDto } from '../donations/dto/create-session.dto'
import { PersonService } from '../person/person.service'
import { KeycloakTokenParsed } from '../auth/keycloak'
import {
  ConvertSubscriptionsCurrencyDto,
  ConvertSubscriptionsCurrencyResponseDto,
  ConvertSingleSubscriptionCurrencyDto,
  SubscriptionConversionResultDto,
} from './dto/currency-conversion.dto'

@Controller('stripe')
@ApiTags('stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly personService: PersonService,
  ) {}

  @Post('setup-intent')
  @Public()
  createSetupIntent() {
    return this.stripeService.createSetupIntent()
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
      const person = await this.personService.findByEmail(sessionDto.personEmail)
      if (!person)
        throw new NotFoundException(`Person with email ${sessionDto.personEmail} not found`)
      sessionDto.personId = person.id
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

    return this.stripeService.createCheckoutSession(sessionDto)
  }

  @Post(':id/refund')
  @Roles({
    roles: [EditFinancialsRequests.role],
    mode: RoleMatchingMode.ANY,
  })
  refundStripePaymet(@Param('id') paymentIntentId: string) {
    return this.stripeService.refundStripePayment(paymentIntentId)
  }

  @Post('setup-intent/:id')
  @Public()
  updateSetupIntent(@Param('id') id: string, @Body() updateSetupIntentDto: UpdateSetupIntentDto) {
    return this.stripeService.updateSetupIntent(id, updateSetupIntentDto)
  }

  @Patch('setup-intent/:id/cancel')
  @Public()
  cancelSetupIntent(@Param('id') id: string) {
    return this.stripeService.cancelSetupIntent(id)
  }

  @Post('setup-intent/:id/payment-intent')
  @ApiBody({
    description: 'Create payment intent from setup intent',
  })
  @Public()
  setupIntentToPaymentIntent(@Param('id') id: string) {
    return this.stripeService.setupIntentToPaymentIntent(id)
  }

  @Post('setup-intent/:id/subscription')
  @ApiBody({
    description: 'Create payment intent from setup intent',
  })
  setupIntentToSubscription(@Param('id') id: string) {
    return this.stripeService.setupIntentToSubscription(id)
  }

  @Post('payment-intent')
  @Public()
  createPaymentIntent(
    @Body()
    createPaymentIntentDto: CreatePaymentIntentDto,
  ) {
    return this.stripeService.createPaymentIntent(createPaymentIntentDto)
  }

  @Post('payment-intent/:id')
  @Public()
  updatePaymentIntent(
    @Param('id') id: string,
    @Body()
    updatePaymentIntentDto: UpdatePaymentIntentDto,
  ) {
    return this.stripeService.updatePaymentIntent(id, updatePaymentIntentDto)
  }

  @Post('payment-intent/:id/cancel')
  @Public()
  cancelPaymentIntent(
    @Param('id') id: string,
    @Body()
    cancelPaymentIntentDto: CancelPaymentIntentDto,
  ) {
    return this.stripeService.cancelPaymentIntent(id, cancelPaymentIntentDto)
  }

  @Get('prices')
  @Public()
  findPrices() {
    return this.stripeService.listPrices()
  }

  @Get('prices/single')
  @Public()
  findSinglePrices() {
    return this.stripeService.listPrices('one_time')
  }

  @Get('prices/recurring')
  @Public()
  findRecurringPrices() {
    return this.stripeService.listPrices('recurring')
  }

  @Post('subscriptions/convert-currency')
  @Roles({
    roles: [EditFinancialsRequests.role],
    mode: RoleMatchingMode.ANY,
  })
  @ApiOperation({
    summary: 'Convert all subscriptions from one currency to another',
    description:
      'Administrative endpoint for bulk converting Stripe subscriptions currency. ' +
      "Designed for Bulgaria's 2026 EUR adoption (BGN to EUR migration). " +
      'Requires EditFinancialsRequests role. Use dryRun=true to preview changes.',
  })
  @ApiBody({ type: ConvertSubscriptionsCurrencyDto })
  @ApiResponse({
    status: 200,
    description: 'Conversion completed successfully',
    type: ConvertSubscriptionsCurrencyResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid parameters or conversion failed',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  convertSubscriptionsCurrency(
    @Body() dto: ConvertSubscriptionsCurrencyDto,
  ): Promise<ConvertSubscriptionsCurrencyResponseDto> {
    Logger.log(
      `[Stripe] Bulk currency conversion requested: ${dto.sourceCurrency} -> ${dto.targetCurrency}`,
    )
    return this.stripeService.convertSubscriptionsCurrency(dto)
  }

  @Post('subscriptions/:id/convert-currency')
  @Roles({
    roles: [EditFinancialsRequests.role],
    mode: RoleMatchingMode.ANY,
  })
  @ApiOperation({
    summary: 'Convert a single subscription to a different currency',
    description:
      'Administrative endpoint for converting a single Stripe subscription currency. ' +
      'Requires EditFinancialsRequests role. Use dryRun=true to preview changes.',
  })
  @ApiBody({ type: ConvertSingleSubscriptionCurrencyDto })
  @ApiResponse({
    status: 200,
    description: 'Conversion completed successfully',
    type: SubscriptionConversionResultDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid parameters or conversion failed',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  convertSingleSubscriptionCurrency(
    @Param('id') subscriptionId: string,
    @Body() dto: ConvertSingleSubscriptionCurrencyDto,
  ): Promise<SubscriptionConversionResultDto> {
    Logger.log(
      `[Stripe] Single subscription currency conversion requested: ${subscriptionId} -> ${dto.targetCurrency}`,
    )
    return this.stripeService.convertSingleSubscriptionCurrency(subscriptionId, dto)
  }
}
