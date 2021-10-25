import Stripe from 'stripe'
import { Injectable, Logger } from '@nestjs/common'
import { StripeWebhookHandler } from '@golevelup/nestjs-stripe'

import { DonationMetadata } from '../dontation-metadata.interface'

@Injectable()
export class PaymentCreatedService {
  @StripeWebhookHandler('payment_intent.created')
  async handlePaymentIntentCreated(event: Stripe.Event) {
    const stripeObject: Stripe.PaymentIntent = event.data.object as Stripe.PaymentIntent
    Logger.log(
      '[ handlePaymentIntentCreated ]',
      stripeObject,
      stripeObject.metadata as DonationMetadata,
    )
  }
}
