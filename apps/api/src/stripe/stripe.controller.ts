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
import { ApiBody, ApiTags } from '@nestjs/swagger'
import {  Public, RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import { CancelPaymentIntentDto } from './dto/cancel-payment-intent.dto'
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto'
import { UpdatePaymentIntentDto } from './dto/update-payment-intent.dto'
import { UpdateSetupIntentDto } from './dto/update-setup-intent.dto'
import { StripeService } from './stripe.service'
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
  createSetupIntent(@Body() body: { idempotencyKey: string }) {
    return this.stripeService.createSetupIntent(body)
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
    @Body() updateSetupIntentDto: UpdateSetupIntentDto,
  ) {
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
  setupIntentToPaymentIntent(
    @Param('id') id: string,
  ) {
    return this.stripeService.setupIntentToPaymentIntent(id)
  }

  @Post('setup-intent/:id/subscription')
  @ApiBody({
    description: 'Create payment intent from setup intent',
  })
  setupIntentToSubscription(
    @Param('id') id: string,
  ) {
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
}
