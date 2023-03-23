import Stripe from 'stripe'
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { StripeWebhookHandler } from '@golevelup/nestjs-stripe'

import { DonationMetadata } from '../dontation-metadata.interface'
import { CampaignService } from '../../campaign/campaign.service'
import { RecurringDonationService } from '../../recurring-donation/recurring-donation.service'
import { CreateRecurringDonationDto } from '../../recurring-donation/dto/create-recurring-donation.dto'

import {
  string2Currency,
  string2RecurringDonationStatus,
  getInvoiceData,
  getPaymentDataFromCharge,
} from '../helpers/payment-intent-helpers'
import { CampaignState, DonationStatus } from '@prisma/client'
import { DonationsService } from '../donations.service'

/** Testing Stripe on localhost is described here:
 * https://github.com/podkrepi-bg/api/blob/master/TESTING.md#testing-stripe
 */
@Injectable()
export class StripePaymentService {
  constructor(
    private campaignService: CampaignService,
    private donationService: DonationsService,
    private recurringDonationService: RecurringDonationService,
  ) {}

  @StripeWebhookHandler('charge.succeeded')
  async handleChargeSucceeded(event: Stripe.Event) {
    const charge: Stripe.Charge = event.data.object as Stripe.Charge
    Logger.log('[ handleChargeSucceeded ]', charge, charge.metadata as DonationMetadata)

    const metadata: DonationMetadata = charge.metadata as DonationMetadata

    if (!metadata.campaignId) {
      Logger.debug('[ handleChargeSucceeded ] No campaignId in metadata ' + charge.id)
      return
    }

    const campaign = await this.campaignService.getCampaignById(metadata.campaignId)

    if (campaign.currency !== charge.currency.toUpperCase()) {
      throw new BadRequestException(
        `Donation in different currency is not allowed. Campaign currency ${
          campaign.currency
        } <> donation currency ${charge.currency.toUpperCase()}`,
      )
    }

    const billingData = getPaymentDataFromCharge(charge)

    await this.donationService.createDonation(
      campaign,
      billingData,
      DonationStatus.succeeded,
      metadata,
    )
    await this.campaignService.donateToCampaign(campaign, billingData)
    await this.checkForCompletedCampaign(metadata.campaignId)
  }

  @StripeWebhookHandler('setup_intent.canceled')
  async handlePaymentIntentCancelled() {
    //TODO: handle cancelling of setup intent
  }

  @StripeWebhookHandler('customer.subscription.created')
  async handleSubscriptionCreated(event: Stripe.Event) {
    const subscription: Stripe.Subscription = event.data.object as Stripe.Subscription
    const recurringDonation = await this.recurringDonationService.findSubscriptionByExtId(
      subscription.id,
    )
    if (recurringDonation) {
      //we already have this subscription in our database
      //stripe already sent us that event
      Logger.log(
        '[ handleSubscriptionCreated ] Subscription with id ' +
          subscription.id +
          ' already exists in our database',
      )
      return
    }

    Logger.log('[ handleSubscriptionCreated ]', subscription)

    const metadata: DonationMetadata = subscription.metadata as DonationMetadata
    if (!metadata.campaignId) {
      throw new BadRequestException(
        'Subscription metadata does not contain target campaignId. Subscription id: ' +
          subscription.id,
      )
    }

    if (!metadata.personId) {
      throw new BadRequestException(
        'Subscription metadata does not contain target personId. Subscription id: ' +
          subscription.id,
      )
    }

    const vault = await this.campaignService.getCampaignVault(metadata.campaignId)
    if (!vault) {
      throw new BadRequestException('Vault for campaign ' + metadata.campaignId + ' does not exist')
    }

    const rdDto: CreateRecurringDonationDto = new CreateRecurringDonationDto()
    rdDto.campaignId = metadata.campaignId
    rdDto.extSubscriptionId = subscription.id
    rdDto.extCustomerId = subscription.customer as string
    rdDto.sourceVault = vault.id

    if (subscription.items.data.length == 0) {
      throw new BadRequestException(
        'Subscription does not contain any items. Subscription id: ' + subscription.id,
      )
    }

    const priceItem = subscription.items.data[0]

    if (priceItem.price.unit_amount) {
      rdDto.amount = priceItem.price.unit_amount as number
    } else {
      throw new BadRequestException(
        'Subscription does not contain amount. Subscription id: ' + subscription.id,
      )
    }

    rdDto.currency = string2Currency(subscription.currency as string)
    rdDto.status = string2RecurringDonationStatus(subscription.status)
    rdDto.sourceVault = vault.id
    rdDto.personId = metadata.personId as string

    Logger.debug('Creating recurring donation with data for ' + rdDto.campaignId)

    await this.recurringDonationService.create(rdDto)
    this.handleSubscriptionUpdated(event)
  }

  @StripeWebhookHandler('customer.subscription.updated')
  async handleSubscriptionUpdated(event: Stripe.Event) {
    const subscription: Stripe.Subscription = event.data.object as Stripe.Subscription
    Logger.log('[ handleSubscriptionUpdated ]', subscription)

    const metadata: DonationMetadata = subscription.metadata as DonationMetadata
    if (!metadata.campaignId) {
      throw new BadRequestException(
        'Subscription metadata does not contain target campaignId. Subscription id: ' +
          subscription.id,
      )
    }

    if (!metadata.personId) {
      throw new BadRequestException(
        'Subscription metadata does not contain target personId. Subscription is: ' + subscription,
      )
    }

    const recurringDonation = await this.recurringDonationService.findSubscriptionByExtId(
      subscription.id,
    )
    if (!recurringDonation) {
      this.handleSubscriptionCreated(event)
      return
    }

    Logger.debug('Updating recurring donation by id ' + recurringDonation.id)

    this.recurringDonationService.updateStatus(
      recurringDonation.id,
      string2RecurringDonationStatus(subscription.status),
    )
  }

  @StripeWebhookHandler('customer.subscription.deleted')
  async handleSubscriptionDeleted(event: Stripe.Event) {
    const subscription: Stripe.Subscription = event.data.object as Stripe.Subscription
    Logger.log('[ handleSubscriptionDeleted ]', subscription)

    const metadata: DonationMetadata = subscription.metadata as DonationMetadata
    if (!metadata.campaignId) {
      throw new BadRequestException(
        'Subscription metadata does not contain target campaignId. Subscription is: ' +
          subscription,
      )
    }

    const recurringDonation = await this.recurringDonationService.findSubscriptionByExtId(
      subscription.id,
    )
    if (!recurringDonation) {
      Logger.debug('Received a notification about unknown subscription: ' + subscription.id)
      return
    }

    Logger.debug('Deleting recurring donation by id ' + recurringDonation.id)

    this.recurringDonationService.updateStatus(
      recurringDonation.id,
      string2RecurringDonationStatus(subscription.status),
    )
  }

  @StripeWebhookHandler('invoice.payment_succeeded')
  async handleInvoicePaid(event: Stripe.Event) {
    const invoice: Stripe.Invoice = event.data.object as Stripe.Invoice
    Logger.log('[ handleInvoicePaid ]', invoice)

    let metadata: DonationMetadata = {
      campaignId: null,
      personId: null,
      isAnonymous: null,
      wish: null,
    }

    invoice.lines.data.forEach((line: Stripe.InvoiceLineItem) => {
      if (line.type === 'subscription') {
        metadata = line.metadata as DonationMetadata
      }
    })

    if (!metadata.campaignId) {
      throw new BadRequestException(
        'Invoice intent metadata does not contain target campaignId. Probably wrong session initiation. Invoice id is:  ' +
          invoice.id,
      )
    }

    const campaign = await this.campaignService.getCampaignById(metadata.campaignId)

    if (campaign.currency !== invoice.currency.toUpperCase()) {
      throw new BadRequestException(
        `Invoice in different currency is not allowed. Campaign currency ${
          campaign.currency
        } <> donation currency ${invoice.currency.toUpperCase()}`,
      )
    }

    const paymentData = getInvoiceData(invoice)

    await this.donationService.createDonation(campaign, paymentData, DonationStatus.succeeded)
    await this.campaignService.donateToCampaign(campaign, paymentData)
    await this.checkForCompletedCampaign(metadata.campaignId)
  }

  //if the campaign is finished, we need to stop all active subscriptions
  async checkForCompletedCampaign(campaignId: string) {
    const updatedCampaign = await this.campaignService.getCampaignById(campaignId)
    if (updatedCampaign.state === CampaignState.complete) {
      const recurring =
        await this.recurringDonationService.findAllActiveRecurringDonationsByCampaignId(campaignId)
      for (const r of recurring) {
        await this.recurringDonationService.cancelSubscription(r.extSubscriptionId)
      }
    }
  }
}
