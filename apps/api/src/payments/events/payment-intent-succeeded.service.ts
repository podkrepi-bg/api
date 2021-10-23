import Stripe from 'stripe'
import { Injectable } from '@nestjs/common'
import { StripeWebhookHandler } from '@golevelup/nestjs-stripe'

@Injectable()
export class PaymentSucceededService {
  @StripeWebhookHandler('payment_intent.succeeded')
  handlePaymentIntentSucceeded(evt: Stripe.Event) {
    console.log('[ handlePaymentIntentSucceeded ]', evt)
  }
}
