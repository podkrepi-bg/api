import Stripe from 'stripe'
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { StripeWebhookHandler } from '@golevelup/nestjs-stripe'

import { StripeMetadata } from '../stripe-metadata.interface'
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
} from '../../donations/helpers/payment-intent-helpers'
import { PaymentStatus, CampaignState } from '@prisma/client'
import { EmailService } from '../../email/email.service'
import { RefundDonationEmailDto } from '../../email/template.interface'
import { PrismaService } from '../../prisma/prisma.service'
import { StripeService } from '../stripe.service'
import { DonationsService } from '../../donations/donations.service'

/** Testing Stripe on localhost is described here:
 * https://github.com/podkrepi-bg/api/blob/master/TESTING.md#testing-stripe
 */
@Injectable()
export class StripePaymentService {
  constructor(
    private campaignService: CampaignService,
    private recurringDonationService: RecurringDonationService,
    private sendEmail: EmailService,
    private stripeService: StripeService,
    private donationService: DonationsService,
  ) {}

  @StripeWebhookHandler('payment_intent.created')
  async handlePaymentIntentCreated(event: Stripe.Event) {
    const paymentIntent: Stripe.PaymentIntent = event.data.object as Stripe.PaymentIntent

    Logger.debug(
      '[ handlePaymentIntentCreated ]',
      paymentIntent,
      paymentIntent.metadata as StripeMetadata,
    )

    const metadata: StripeMetadata = paymentIntent.metadata as StripeMetadata

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
    await this.donationService.updateDonationPayment(campaign, paymentData, PaymentStatus.waiting)
  }

  @StripeWebhookHandler('payment_intent.canceled')
  async handlePaymentIntentCancelled(event: Stripe.Event) {
    const paymentIntent: Stripe.PaymentIntent = event.data.object as Stripe.PaymentIntent
    Logger.log(
      '[ handlePaymentIntentCancelled ]',
      paymentIntent,
      paymentIntent.metadata as StripeMetadata,
    )

    const billingData = getPaymentData(paymentIntent)

    this.updatePaymentPaymentStatus(paymentIntent, billingData, PaymentStatus.cancelled)
  }

  @StripeWebhookHandler('payment_intent.payment_failed')
  async handlePaymentIntentFailed(event: Stripe.Event) {
    const paymentIntent: Stripe.PaymentIntent = event.data.object as Stripe.PaymentIntent
    Logger.log(
      '[ handlePaymentIntentFailed ]',
      paymentIntent,
      paymentIntent.metadata as StripeMetadata,
    )

    const billingData = getPaymentData(paymentIntent)

    await this.updatePaymentPaymentStatus(paymentIntent, billingData, PaymentStatus.declined)
  }

  async updatePaymentPaymentStatus(
    paymentIntent: Stripe.PaymentIntent,
    billingData: PaymentData,
    PaymentStatus: PaymentStatus,
  ) {
    const metadata: StripeMetadata = paymentIntent.metadata as StripeMetadata
    if (!metadata.campaignId) {
      throw new BadRequestException(
        'Payment intent metadata does not contain target campaignId. Probably wrong session initiation. Payment intent is:  ' +
          paymentIntent.id,
      )
    }

    const campaign = await this.campaignService.getCampaignById(metadata.campaignId)

    await this.donationService.updateDonationPayment(campaign, billingData, PaymentStatus)
  }

  @StripeWebhookHandler('charge.succeeded')
  async handleChargeSucceeded(event: Stripe.Event) {
    const charge: Stripe.Charge = event.data.object as Stripe.Charge
    Logger.log('[ handleChargeSucceeded ]', charge, charge.metadata as StripeMetadata)

    const metadata: StripeMetadata = charge.metadata as StripeMetadata

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

    const donationId = await this.donationService.updateDonationPayment(
      campaign,
      billingData,
      PaymentStatus.succeeded,
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
      chargePaymentIntent.metadata as StripeMetadata,
    )

    const metadata: StripeMetadata = chargePaymentIntent.metadata as StripeMetadata

    if (!metadata.campaignId) {
      Logger.debug('[ handleRefundCreated ] No campaignId in metadata ' + chargePaymentIntent.id)
      return
    }

    const billingData = getPaymentDataFromCharge(chargePaymentIntent)

    const campaign = await this.campaignService.getCampaignById(metadata.campaignId)

    await this.donationService.updateDonationPayment(campaign, billingData, PaymentStatus.refund)

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

    // Check if this is a currency conversion subscription
    // These are already handled by updateLocalRecurringDonation in stripe.service.ts
    const metadata = subscription.metadata as StripeMetadata & {
      originalSubscriptionId?: string
    }
    if (metadata.originalSubscriptionId) {
      Logger.log(
        `[ handleSubscriptionCreated ] Subscription ${subscription.id} is a currency conversion ` +
          `from ${metadata.originalSubscriptionId}. Already handled by conversion endpoint.`,
      )
      return
    }

    Logger.log('[ handleSubscriptionCreated ]', subscription)

    // metadata is already defined above with the extended type
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

    const metadata: StripeMetadata = subscription.metadata as StripeMetadata
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

    // Check if this subscription was canceled for currency conversion
    // The recurring donation will be updated with the new subscription ID, not marked as canceled
    const cancellationComment = subscription.cancellation_details?.comment
    if (cancellationComment?.startsWith('currency_conversion:')) {
      const targetCurrency = cancellationComment.split(':')[1]
      Logger.log(
        `[ handleSubscriptionDeleted ] Subscription ${subscription.id} was canceled for currency ` +
          `conversion to ${targetCurrency}. Skipping status update.`,
      )
      return
    }

    const metadata = subscription.metadata as StripeMetadata

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
      // Check if this subscription is being converted to a new currency
      // In that case, the extSubscriptionId has been prefixed with 'converting:'
      const convertingDonation = await this.recurringDonationService.findSubscriptionByExtId(
        `converting:${subscription.id}`,
      )
      if (convertingDonation) {
        Logger.log(
          `[ handleSubscriptionDeleted ] Subscription ${subscription.id} is being converted. ` +
            `Skipping status update.`,
        )
        return
      }
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
    const invoiceFromEvent: Stripe.Invoice = event.data.object as Stripe.Invoice

    // Retrieve the invoice with expanded payments array
    // In Stripe API version 2025-03-31 (Basil) and later, invoices have a 'payments' array
    // instead of direct 'charge' and 'payment_intent' fields
    const invoice = (await this.stripeService.retrieveInvoice(
      invoiceFromEvent.id,
    )) as Stripe.Invoice

    Logger.log('[ handleInvoicePaid ] invoice body', invoice)
    let metadata: StripeMetadata = {
      type: null,
      campaignId: null,
      personId: null,
      isAnonymous: null,
      wish: null,
    }

    Logger.log('[ handleInvoicePaid ] invoice.parent', invoice.parent)

    if (!invoice?.parent?.subscription_details?.metadata) {
      throw new BadRequestException(
        'Invoice parent does not contain subscription_details. Invoice id is:  ' + invoice.id,
      )
    }
    metadata = invoice.parent.subscription_details.metadata as StripeMetadata
    Logger.log('[ handleInvoicePaid ] metadata', metadata)

    if (!metadata.campaignId) {
      throw new BadRequestException(
        'Invoice intent metadata does not contain target campaignId. Probably wrong session initiation. Invoice id is:  ' +
          invoice.id,
      )
    }

    // Skip processing for zero-amount invoices (e.g., trial invoices from currency conversion)
    // These don't represent actual payments and should not create donation records
    if (invoice.amount_due === 0 && invoice.amount_paid === 0) {
      Logger.log(
        `[ handleInvoicePaid ] Skipping zero-amount invoice ${invoice.id} (likely a trial from currency conversion)`,
      )
      return
    }

    const campaign = await this.campaignService.getCampaignById(metadata.campaignId)

    if (campaign.currency !== invoice.currency.toUpperCase()) {
      throw new BadRequestException(
        `Invoice in different currency is not allowed. Campaign currency ${
          campaign.currency
        } <> donation currency ${invoice.currency.toUpperCase()}`,
      )
    }

    // Extract payment and charge from the new payments structure
    // In API version 2025-03-31+, invoices have a 'payments' array instead of direct charge/payment_intent fields
    type InvoiceWithPayments = Stripe.Invoice & {
      payments?: {
        data: Array<{
          payment?: {
            payment_intent?: Stripe.PaymentIntent
          }
        }>
      }
    }

    const invoiceWithPayments = invoice as InvoiceWithPayments

    if (!invoiceWithPayments.payments?.data || invoiceWithPayments.payments.data.length === 0) {
      throw new BadRequestException(
        `No payments found for invoice ${invoice.id}. The invoice may not have been paid yet.`,
      )
    }

    // Get the first payment (for recurring subscriptions, there should typically be one payment per invoice)
    const firstPayment = invoiceWithPayments.payments.data[0]
    const paymentIntent = firstPayment?.payment?.payment_intent

    if (!paymentIntent) {
      throw new BadRequestException(
        `Unable to retrieve payment intent for invoice ${invoice.id}. The payment data may not be available yet.`,
      )
    }

    // Extract the charge from the payment intent's latest_charge field
    const latestCharge = paymentIntent.latest_charge
    let charge: Stripe.Charge | undefined

    if (typeof latestCharge === 'string') {
      // If latest_charge is just an ID, we need to retrieve it
      charge = await this.stripeService.findChargeById(latestCharge)
    } else if (latestCharge && typeof latestCharge === 'object') {
      // If latest_charge is already expanded, use it directly
      charge = latestCharge as Stripe.Charge
    }

    if (!charge) {
      throw new BadRequestException(
        `Unable to retrieve charge for invoice ${invoice.id}. The charge may not be available yet.`,
      )
    }

    const paymentData = getInvoiceData(invoice, charge, metadata)

    await this.donationService.updateDonationPayment(campaign, paymentData, PaymentStatus.succeeded)

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
        await this.stripeService.cancelSubscription(r.extSubscriptionId)
      }
    }
  }
}
