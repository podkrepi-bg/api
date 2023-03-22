import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Public } from 'nest-keycloak-connect'
import { CancelPaymentIntentDto } from './dto/cancel-payment-intent.dto'
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto'
import { CreateSetupIntentDto } from './dto/create-setup-intent.dto'
import { UpdatePaymentIntentDto } from './dto/update-payment-intent.dto'
import { StripeService } from './stripe.service'

@Controller('stripe')
@ApiTags('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('setup-intent')
  @Public()
  createSetupIntent() {
    return this.stripeService.createSetupIntent()
  }

  @Post('setup-intent/:id')
  @Public()
  updateSetupIntent(
    @Param('id') id: string,
    @Body()
    updatePaymentIntentDto: UpdatePaymentIntentDto,
  ) {
    return this.stripeService.updateSetupIntent(id, updatePaymentIntentDto)
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
