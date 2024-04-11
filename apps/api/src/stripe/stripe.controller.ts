import {
  Body,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  Post,
  UnauthorizedException,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { AuthenticatedUser, Public, RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import { CancelPaymentIntentDto } from './dto/cancel-payment-intent.dto'
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto'
import { UpdatePaymentIntentDto } from './dto/update-payment-intent.dto'
import { UpdateSetupIntentDto } from './dto/update-setup-intent.dto'
import { StripeService } from './stripe.service'
import { KeycloakTokenParsed } from '../auth/keycloak'
import { CreateSubscriptionPaymentDto } from './dto/create-subscription-payment.dto'
import { EditFinancialsRequests } from '@podkrepi-bg/podkrepi-types'
import { CreateSessionDto } from '../donations/dto/create-session.dto'
import { PersonService } from '../person/person.service'

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
  updateSetupIntent(
    @Param('id') id: string,
    @Body()
    updateSetupIntentDto: UpdateSetupIntentDto,
  ) {
    console.log(updateSetupIntentDto)
    return this.stripeService.updateSetupIntent(id, updateSetupIntentDto)
  }

  @Post('setup-intent/:id/finalize')
  @Public()
  finalizeSetupIntent(@Param('id') id: string) {
    return this.stripeService.finalizeSetupIntent(id)
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

  @Post('create-subscription')
  createSubscription(
    @AuthenticatedUser() user: KeycloakTokenParsed,
    @Body() createSubscriptionDto: CreateSubscriptionPaymentDto,
  ) {
    return this.stripeService.createSubscription(user, createSubscriptionDto)
  }
  @Get('prices/recurring')
  @Public()
  findRecurringPrices() {
    return this.stripeService.listPrices('recurring')
  }
}
