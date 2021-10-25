import Stripe from 'stripe'
import { Injectable } from '@nestjs/common'
import { StripeWebhookHandler } from '@golevelup/nestjs-stripe'

import { DonationMetadata } from '../dontation-metadata.interface'

@Injectable()
export class PaymentSucceededService {
  @StripeWebhookHandler('payment_intent.succeeded')
  handlePaymentIntentSucceeded(event: Stripe.Event) {
    const stripeObject: Stripe.PaymentIntent = event.data.object as Stripe.PaymentIntent
    console.log(
      '[ handlePaymentIntentSucceeded ]',
      stripeObject,
      stripeObject.metadata as DonationMetadata,
    )
  }
}
