import Stripe from 'stripe'
import { StripeWebhookHandler } from '@golevelup/nestjs-stripe'
import { BadRequestException, Injectable, Logger } from '@nestjs/common'

import { CampaignService } from '../../campaign/campaign.service'
import { DonationMetadata } from '../dontation-metadata.interface'

@Injectable()
export class PaymentSucceededService {
  constructor(private campaignService: CampaignService) {}

  @StripeWebhookHandler('payment_intent.succeeded')
  async handlePaymentIntentSucceeded(event: Stripe.Event) {
    const stripeObject: Stripe.PaymentIntent = event.data.object as Stripe.PaymentIntent
    Logger.log(
      '[ handlePaymentIntentSucceeded ]',
      stripeObject,
      stripeObject.metadata as DonationMetadata,
    )

    const metadata: DonationMetadata = stripeObject.metadata as DonationMetadata
    if (!metadata.campaignId) {
      throw new BadRequestException('Campaign not attached to payment intent')
    }

    const campaign = await this.campaignService.getCampaignById(metadata.campaignId)

    if (campaign.currency !== stripeObject.currency.toUpperCase()) {
      throw new BadRequestException('Donation in different currency is not allowed')
    }

    await this.campaignService.donateToCampaign(campaign.id, stripeObject.amount)
  }
}
