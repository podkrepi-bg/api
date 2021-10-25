import Stripe from 'stripe'
import { Injectable } from '@nestjs/common'
import { StripeWebhookHandler } from '@golevelup/nestjs-stripe'

import { DonationMetadata } from '../dontation-metadata.interface'

@Injectable()
export class PaymentCreatedService {
  @StripeWebhookHandler('payment_intent.created')
  handlePaymentIntentCreated(event: Stripe.Event) {
    const stripeObject: Stripe.PaymentIntent = event.data.object as Stripe.PaymentIntent
    console.log(
      '[ handlePaymentIntentCreated ]',
      stripeObject,
      stripeObject.metadata as DonationMetadata,
    )
  }
}
