import Stripe from 'stripe'
import { Injectable } from '@nestjs/common'
import { StripeWebhookHandler } from '@golevelup/nestjs-stripe'

@Injectable()
export class PaymentCreatedService {
  @StripeWebhookHandler('payment_intent.created')
  handlePaymentIntentCreated(evt: Stripe.Event) {
    console.log('[ handlePaymentIntentCreated ]', evt)
  }
}
