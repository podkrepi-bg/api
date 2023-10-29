import Stripe from 'stripe'
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { StripeWebhookHandler } from '@golevelup/nestjs-stripe'

import { DonationMetadata } from '../dontation-metadata.interface'
import { CampaignService } from '../../campaign/campaign.service'
import { RecurringDonationService } from '../../recurring-donation/recurring-donation.service'
import { CreateRecurringDonationDto } from '../../recurring-donation/dto/create-recurring-donation.dto'

import {
  getPaymentData,
  string2Currency,
  string2RecurringDonationStatus,
  getInvoiceData,
  getPaymentDataFromCharge,
  PaymentData,
} from '../helpers/payment-intent-helpers'
import { DonationStatus, CampaignState } from '@prisma/client'
import { EmailService } from '../../email/email.service'
import { RefundDonationEmailDto } from '../../email/template.interface'
import { PrismaService } from '../../prisma/prisma.service'

/** Testing Stripe on localhost is described here:
 * https://github.com/podkrepi-bg/api/blob/master/TESTING.md#testing-stripe
 */
@Injectable()
export class StripePaymentService {
  constructor(
    private campaignService: CampaignService,
    private recurringDonationService: RecurringDonationService,
    private sendEmail: EmailService,
    private prismaService: PrismaService,
  ) {}

  @StripeWebhookHandler('payment_intent.created')
  async handlePaymentIntentCreated(event: Stripe.Event) {
    const paymentIntent: Stripe.PaymentIntent = event.data.object as Stripe.PaymentIntent

    Logger.debug(
      '[ handlePaymentIntentCreated ]',
      paymentIntent,
      paymentIntent.metadata as DonationMetadata,
    )

    const metadata: DonationMetadata = paymentIntent.metadata as DonationMetadata

    if (!metadata.campaignId) {
      Logger.debug('[ handlePaymentIntentCreated ] No campaignId in metadata ' + paymentIntent.id)
      return
    }

    const campaign = await this.campaignService.getCampaignById(metadata.campaignId)

    if (campaign.currency !== paymentIntent.currency.toUpperCase()) {
      throw new BadRequestException(
        `Donation in different currency is not allowed. Campaign currency ${
          campaign.currency
        } <> donation currency ${paymentIntent.currency.toUpperCase()}`,
      )
    }

    const paymentData = getPaymentData(paymentIntent)
    /*
     * Handle the create event
     */
    await this.campaignService.updateDonationPayment(campaign, paymentData, DonationStatus.waiting)
  }

  @StripeWebhookHandler('payment_intent.canceled')
  async handlePaymentIntentCancelled(event: Stripe.Event) {
    const paymentIntent: Stripe.PaymentIntent = event.data.object as Stripe.PaymentIntent
    Logger.log(
      '[ handlePaymentIntentCancelled ]',
      paymentIntent,
      paymentIntent.metadata as DonationMetadata,
    )

    const billingData = getPaymentData(paymentIntent)

    this.updatePaymentDonationStatus(paymentIntent, billingData, DonationStatus.cancelled)
  }

  @StripeWebhookHandler('payment_intent.payment_failed')
  async handlePaymentIntentFailed(event: Stripe.Event) {
    const paymentIntent: Stripe.PaymentIntent = event.data.object as Stripe.PaymentIntent
    Logger.log(
      '[ handlePaymentIntentFailed ]',
      paymentIntent,
      paymentIntent.metadata as DonationMetadata,
    )

    const billingData = getPaymentData(paymentIntent)

    await this.updatePaymentDonationStatus(paymentIntent, billingData, DonationStatus.declined)
  }

  async updatePaymentDonationStatus(
    paymentIntent: Stripe.PaymentIntent,
    billingData: PaymentData,
    donationStatus: DonationStatus,
  ) {
    const metadata: DonationMetadata = paymentIntent.metadata as DonationMetadata
    if (!metadata.campaignId) {
      throw new BadRequestException(
        'Payment intent metadata does not contain target campaignId. Probably wrong session initiation. Payment intent is:  ' +
          paymentIntent.id,
      )
    }

    const campaign = await this.campaignService.getCampaignById(metadata.campaignId)

    await this.campaignService.updateDonationPayment(campaign, billingData, donationStatus)
  }

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

    const donationId = await this.campaignService.updateDonationPayment(
      campaign,
      billingData,
      DonationStatus.succeeded,
      metadata,
    )

    //updateDonationPayment will mark the campaign as completed if amount is reached
    await this.cancelSubscriptionsIfCompletedCampaign(metadata.campaignId)

    //and finally save the donation wish
    if (donationId && metadata?.wish) {
      await this.campaignService.createDonationWish(metadata.wish, donationId, campaign.id)
    }
  }

  @StripeWebhookHandler('charge.refunded')
  async handleRefundCreated(event: Stripe.Event) {
    const chargePaymentIntent: Stripe.Charge = event.data.object as Stripe.Charge
    Logger.log(
      '[ handleRefundCreated ]',
      chargePaymentIntent,
      chargePaymentIntent.metadata as DonationMetadata,
    )

    const metadata: DonationMetadata = chargePaymentIntent.metadata as DonationMetadata

    if (!metadata.campaignId) {
      Logger.debug('[ handleRefundCreated ] No campaignId in metadata ' + chargePaymentIntent.id)
      return
    }

    const billingData = getPaymentDataFromCharge(chargePaymentIntent)

    const campaign = await this.campaignService.getCampaignById(metadata.campaignId)

    await this.campaignService.updateDonationPayment(
      campaign,
      billingData,
      DonationStatus.refund,
      metadata,
    )

    if (billingData.billingEmail !== undefined) {
      const recepient = { to: [billingData.billingEmail] }
      const mail = new RefundDonationEmailDto({
        campaignName: campaign.title,
        currency: billingData.currency.toUpperCase(),
        netAmount: billingData.netAmount / 100,
        taxAmount: (billingData.chargedAmount - billingData.netAmount) / 100,
      })
      // Send Notification

      await this.sendEmail.sendFromTemplate(mail, recepient, {
        //Allow users to receive the mail, regardles of unsubscribes
        bypassUnsubscribeManagement: { enable: true },
      })
    }
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

  @StripeWebhookHandler('invoice.paid')
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

    await this.campaignService.updateDonationPayment(
      campaign,
      paymentData,
      DonationStatus.succeeded,
    )

    //updateDonationPayment will mark the campaign as completed if amount is reached
    await this.cancelSubscriptionsIfCompletedCampaign(metadata.campaignId)
  }

  //if the campaign is finished, we need to stop all active subscriptions
  async cancelSubscriptionsIfCompletedCampaign(campaignId: string) {
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
