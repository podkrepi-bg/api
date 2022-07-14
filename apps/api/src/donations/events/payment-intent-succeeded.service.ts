import Stripe from 'stripe'
import { StripeWebhookHandler } from '@golevelup/nestjs-stripe'
import { BadRequestException, Injectable, Logger } from '@nestjs/common'

import { CampaignService } from '../../campaign/campaign.service'
import { DonationMetadata } from '../dontation-metadata.interface'
import { getPaymentData } from './payment-intent-helpers'

@Injectable()
export class PaymentSucceededService {
  constructor(private campaignService: CampaignService) {}

  @StripeWebhookHandler('payment_intent.succeeded')
  async handlePaymentIntentSucceeded(event: Stripe.Event) {
    const paymentIntent: Stripe.PaymentIntent = event.data.object as Stripe.PaymentIntent
    Logger.log(
      '[ handlePaymentIntentSucceeded ]',
      paymentIntent,
      paymentIntent.metadata as DonationMetadata,
    )

    const metadata: DonationMetadata = paymentIntent.metadata as DonationMetadata
    if (!metadata.campaignId) {
      throw new BadRequestException(
        'Payment intent metadata does not contain target campaignId. Probably wrong session initiation. Payment intent is:  ' +
          paymentIntent.id,
      )
    }

    const campaign = await this.campaignService.getCampaignById(metadata.campaignId)

    if (campaign.currency !== paymentIntent.currency.toUpperCase()) {
      throw new BadRequestException(
        `Donation in different currency is not allowed. Campaign currency ${
          campaign.currency
        } <> donation currency ${paymentIntent.currency.toUpperCase()}`,
      )
    }

    const billingData = getPaymentData(paymentIntent)

    await this.campaignService.donateToCampaign(campaign, billingData)
  }
}
