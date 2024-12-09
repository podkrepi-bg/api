import { InjectStripeClient } from '@golevelup/nestjs-stripe'
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import Stripe from 'stripe'
import { UpdateSetupIntentDto } from './dto/update-setup-intent.dto'
import { KeycloakTokenParsed } from '../auth/keycloak'
import { CreateSubscriptionPaymentDto } from './dto/create-subscription-payment.dto'
import { CampaignService } from '../campaign/campaign.service'
import { PersonService } from '../person/person.service'
import { DonationsService } from '../donations/donations.service'
import { CreateSessionDto } from '../donations/dto/create-session.dto'
import { Campaign, DonationMetadata, Payment } from '@prisma/client'
import { ConfigService } from '@nestjs/config'
import { StripeMetadata } from './stripe-metadata.interface'
import { CreateStripePaymentDto } from '../donations/dto/create-stripe-payment.dto'
import { RecurringDonationService } from '../recurring-donation/recurring-donation.service'
import * as crypto from 'crypto'

@Injectable()
export class StripeService {
  constructor(
    @InjectStripeClient() private stripeClient: Stripe,
    private personService: PersonService,
    private campaignService: CampaignService,
    private donationService: DonationsService,
    private configService: ConfigService,
    private reacurringDonationService: RecurringDonationService,
  ) {}

  /**
   * Update a setup intent for a donation
   * @param inputDto Payment intent update params
   * @returns {Promise<Stripe.Response<Stripe.SetupIntent>>}
   */
  async updateSetupIntent(
    id: string,
    inputDto: UpdateSetupIntentDto,
  ): Promise<Stripe.Response<Stripe.SetupIntent>> {
    if (!inputDto.metadata.campaignId)
      throw new BadRequestException('campaignId is missing from metadata')
    await this.campaignService.validateCampaignId(inputDto.metadata.campaignId as string)
    const idempotencyKey = crypto.randomUUID()
    return await this.stripeClient.setupIntents.update(id, inputDto, { idempotencyKey })
  }
  /**
   * Create a payment intent for a donation
   * https://stripe.com/docs/api/payment_intents/create
   * @param inputDto Payment intent create params
   * @returns {Promise<Stripe.Response<Stripe.PaymentIntent>>}
   */

  async cancelSetupIntent(id: string) {
    return await this.stripeClient.setupIntents.cancel(id)
  }
  async findSetupIntentById(setupIntentId: string): Promise<Stripe.SetupIntent | Error> {
    const setupIntent = await this.stripeClient.setupIntents.retrieve(setupIntentId, {
      expand: ['payment_method'],
    })

    if (!setupIntent.payment_method || typeof setupIntent.payment_method === 'string') {
      throw new BadRequestException('Payment method is missing from setup intent')
    }
    const paymentMethod = setupIntent.payment_method

    if (!paymentMethod?.billing_details?.email) {
      throw new BadRequestException('Email is required from the payment method')
    }
    if (!setupIntent.metadata || !setupIntent.metadata.amount || !setupIntent.metadata.currency) {
      throw new BadRequestException('Amount and currency are required from the setup intent')
    }
    return setupIntent
  }

  async attachPaymentMethodToCustomer(
    paymentMethod: Stripe.PaymentMethod,
    customer: Stripe.Customer,
  ) {
    const idempotencyKey = crypto.randomUUID()

    return await this.stripeClient.paymentMethods.attach(
      paymentMethod.id,
      {
        customer: customer.id,
      },
      { idempotencyKey: `${idempotencyKey}--pm` },
    )
  }
  async setupIntentToPaymentIntent(setupIntentId: string): Promise<Stripe.PaymentIntent> {
    const setupIntent = await this.findSetupIntentById(setupIntentId)

    if (setupIntent instanceof Error) throw new BadRequestException(setupIntent.message)
    const paymentMethod = setupIntent.payment_method as Stripe.PaymentMethod
    const email = paymentMethod.billing_details.email as string
    const name = paymentMethod.billing_details.name as string
    const metadata = setupIntent.metadata as Stripe.Metadata

    const customer = await this.createCustomer(email, name, paymentMethod)

    await this.attachPaymentMethodToCustomer(paymentMethod, customer)
    const idempotencyKey = crypto.randomUUID()

    const paymentIntent = await this.stripeClient.paymentIntents.create(
      {
        amount: Math.round(Number(metadata.amount)),
        currency: metadata.currency,
        customer: customer.id,
        payment_method: paymentMethod.id,
        confirm: true,
        metadata: {
          ...setupIntent.metadata,
        },
      },
      { idempotencyKey: `${idempotencyKey}--pi` },
    )
    return paymentIntent
  }
  /**
   * Create a setup intent for a donation
   * @param inputDto Payment intent create params
   * @returns {Promise<Stripe.Response<Stripe.PaymentIntent>>}
   */
  async createSetupIntent(): Promise<Stripe.Response<Stripe.SetupIntent>> {
    const idempotencyKey = crypto.randomUUID()
    return await this.stripeClient.setupIntents.create({}, { idempotencyKey })
  }

  async setupIntentToSubscription(setupIntentId: string): Promise<Stripe.PaymentIntent | Error> {
    const setupIntent = await this.findSetupIntentById(setupIntentId)
    if (setupIntent instanceof Error) throw new BadRequestException(setupIntent.message)
    const paymentMethod = setupIntent.payment_method as Stripe.PaymentMethod
    const email = paymentMethod.billing_details.email as string
    const name = paymentMethod.billing_details.name as string
    const metadata = setupIntent.metadata as Stripe.Metadata

    const customer = await this.createCustomer(email, name, paymentMethod)
    await this.attachPaymentMethodToCustomer(paymentMethod, customer)

    const product = await this.createProduct(metadata.campaignId)
    return await this.createSubscription(metadata, customer, product, paymentMethod)
  }

  /**
   * Update a payment intent for a donation
   * https://stripe.com/docs/api/payment_intents/update
   * @param inputDto Payment intent create params
   * @returns {Promise<Stripe.Response<Stripe.PaymentIntent>>}
   */
  async updatePaymentIntent(
    id: string,
    inputDto: Stripe.PaymentIntentUpdateParams,
  ): Promise<Stripe.Response<Stripe.PaymentIntent>> {
    return this.stripeClient.paymentIntents.update(id, inputDto)
  }

  /**
   * Cancel a payment intent for a donation
   * https://stripe.com/docs/api/payment_intents/cancel
   * @param inputDto Payment intent create params
   * @returns {Promise<Stripe.Response<Stripe.PaymentIntent>>}
   */
  async cancelPaymentIntent(
    id: string,
    inputDto: Stripe.PaymentIntentCancelParams,
  ): Promise<Stripe.Response<Stripe.PaymentIntent>> {
    return this.stripeClient.paymentIntents.cancel(id, inputDto)
  }

  async listPrices(type?: Stripe.PriceListParams.Type, active?: boolean): Promise<Stripe.Price[]> {
    const listResponse = await this.stripeClient.prices.list({ active, type, limit: 100 }).then(
      function (list) {
        Logger.debug('[Stripe] Prices received: ' + list.data.length)
        return { list }
      },
      function (error) {
        if (error instanceof Stripe.errors.StripeError)
          Logger.error(
            '[Stripe] Error while getting price list. Error type: ' +
              error.type +
              ' message: ' +
              error.message +
              ' full error: ' +
              JSON.stringify(error),
          )
      },
    )

    if (listResponse) {
      return listResponse.list.data.filter((price) => price.active)
    } else return new Array<Stripe.Price>()
  }

  async createCustomer(email: string, name: string, paymentMethod: Stripe.PaymentMethod) {
    const customerLookup = await this.stripeClient.customers.list({
      email,
    })
    const idempotencyKey = crypto.randomUUID()
    const customer = customerLookup.data[0]
    //Customer not found. Create new onw
    if (!customer)
      return await this.stripeClient.customers.create(
        {
          email,
          name,
          payment_method: paymentMethod.id,
        },
        { idempotencyKey: `${idempotencyKey}--customer` },
      )

    return customer
  }

  async createProduct(campaignId: string): Promise<Stripe.Product> {
    const campaign = await this.campaignService.getCampaignById(campaignId)
    const idempotencyKey = crypto.randomUUID()
    if (!campaign) throw new Error(`Campaign with id ${campaignId} not found`)

    const productLookup = await this.stripeClient.products.search({
      query: `metadata["campaignId"]:"${campaign.id}"`,
    })

    if (productLookup.data.length) return productLookup.data[0]
    return await this.stripeClient.products.create(
      {
        name: campaign.title,
        description: `Donate to ${campaign.title}`,
        metadata: {
          campaignId: campaign.id,
        },
      },
      { idempotencyKey: `${idempotencyKey}--product` },
    )
  }
  async createSubscription(
    metadata: Stripe.Metadata,
    customer: Stripe.Customer,
    product: Stripe.Product,
    paymentMethod: Stripe.PaymentMethod,
  ) {
    const idempotencyKey = crypto.randomUUID()

    const subscription = await this.stripeClient.subscriptions.create(
      {
        customer: customer.id,
        items: [
          {
            price_data: {
              unit_amount: Math.round(Number(metadata.amount)),
              currency: metadata.currency,
              product: product.id,
              recurring: { interval: 'month' },
            },
          },
        ],
        default_payment_method: paymentMethod.id,
        payment_settings: {
          save_default_payment_method: 'on_subscription',
          payment_method_types: ['card'],
        },
        metadata: {
          type: metadata.type,
          campaignId: metadata.campaignId,
          personId: metadata.personId,
        },
        expand: ['latest_invoice.payment_intent'],
      },
      { idempotencyKey: `${idempotencyKey}--subscription` },
    )
    //include metadata in payment-intent
    const invoice = subscription.latest_invoice as Stripe.Invoice
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent
    return paymentIntent
  }

  async createCheckoutSession(
    sessionDto: CreateSessionDto,
  ): Promise<void | { session: Stripe.Checkout.Session }> {
    const campaign = await this.campaignService.validateCampaignId(sessionDto.campaignId)
    const { mode } = sessionDto
    const appUrl = this.configService.get<string>('APP_URL')

    const metadata: StripeMetadata = {
      campaignId: sessionDto.campaignId,
      personId: sessionDto.personId,
      isAnonymous: sessionDto.isAnonymous ? 'true' : 'false',
      wish: sessionDto.message ?? null,
      type: sessionDto.type,
    }

    const items = await this.prepareSessionItems(sessionDto, campaign)
    const createSessionRequest: Stripe.Checkout.SessionCreateParams = {
      mode,
      customer_email: sessionDto.personEmail,
      line_items: items,
      payment_method_types: ['card'],
      payment_intent_data: mode == 'payment' ? { metadata } : undefined,
      subscription_data: mode == 'subscription' ? { metadata } : undefined,
      success_url: sessionDto.successUrl ?? `${appUrl}/success`,
      cancel_url: sessionDto.cancelUrl ?? `${appUrl}/canceled`,
      tax_id_collection: { enabled: true },
    }

    const sessionResponse = await this.stripeClient.checkout.sessions
      .create(createSessionRequest)
      .then(
        function (session) {
          Logger.debug('[Stripe] Checkout session created.')
          return { session }
        },
        function (error) {
          if (error instanceof Stripe.errors.StripeError)
            Logger.error(
              '[Stripe] Error while creating checkout session. Error type: ' +
                error.type +
                ' message: ' +
                error.message +
                ' full error: ' +
                JSON.stringify(error),
            )
        },
      )

    if (sessionResponse) {
      this.donationService.createInitialDonationFromSession(
        campaign,
        sessionDto,
        (sessionResponse.session.payment_intent as string) ?? sessionResponse.session.id,
      )
    }

    return sessionResponse
  }

  private async prepareSessionItems(
    sessionDto: CreateSessionDto,
    campaign: Campaign,
  ): Promise<Stripe.Checkout.SessionCreateParams.LineItem[]> {
    if (sessionDto.mode == 'subscription') {
      // the membership campaign is internal only
      // we need to make the subscriptions once a year
      const isMembership = await this.campaignService.isMembershipCampaign(campaign.campaignTypeId)
      const interval = isMembership ? 'year' : 'month'

      //use an inline price for subscriptions
      const stripeItem = {
        price_data: {
          currency: campaign.currency,
          unit_amount: sessionDto.amount,
          recurring: {
            interval: interval as Stripe.Price.Recurring.Interval,
            interval_count: 1,
          },
          product_data: {
            name: campaign.title,
          },
        },
        quantity: 1,
      }
      return [stripeItem]
    }
    // Create donation with custom amount
    return [
      {
        price_data: {
          currency: campaign.currency,
          unit_amount: sessionDto.amount,
          product_data: {
            name: campaign.title,
          },
        },
        quantity: 1,
      },
    ]
  }

  /**
   * Create a payment intent for a donation
   * @param inputDto Payment intent create params
   * @returns {Promise<Stripe.Response<Stripe.PaymentIntent>>}
   */
  async createPaymentIntent(
    inputDto: Stripe.PaymentIntentCreateParams,
  ): Promise<Stripe.Response<Stripe.PaymentIntent>> {
    return await this.stripeClient.paymentIntents.create(inputDto)
  }

  /**
   * Create a payment intent for a donation
   * https://stripe.com/docs/api/payment_intents/create
   * @param inputDto Payment intent create params
   * @returns {Promise<Stripe.Response<Stripe.PaymentIntent>>}
   */
  async createStripePayment(inputDto: CreateStripePaymentDto): Promise<Payment> {
    const intent = await this.stripeClient.paymentIntents.retrieve(inputDto.paymentIntentId)
    if (!intent.metadata.campaignId) {
      throw new BadRequestException('Campaign id is missing from payment intent metadata')
    }
    const campaignId = intent.metadata.camapaignId
    const campaign = await this.campaignService.validateCampaignId(campaignId)
    return this.donationService.createInitialDonationFromIntent(campaign, inputDto, intent)
  }

  /**
   * Refund a stipe payment donation
   * https://stripe.com/docs/api/refunds/create
   * @param inputDto Refund-stripe params
   * @returns {Promise<Stripe.Response<Stripe.Refund>>}
   */
  async refundStripePayment(paymentIntentId: string): Promise<Stripe.Response<Stripe.Refund>> {
    const intent = await this.stripeClient.paymentIntents.retrieve(paymentIntentId)
    if (!intent) {
      throw new BadRequestException('Payment Intent is missing from stripe')
    }

    if (!intent.metadata.campaignId) {
      throw new BadRequestException('Campaign id is missing from payment intent metadata')
    }

    return await this.stripeClient.refunds.create({
      payment_intent: paymentIntentId,
      reason: 'requested_by_customer',
    })
  }

  async cancelSubscription(subscriptionId: string) {
    Logger.log(`Canceling subscription with api request to cancel: ${subscriptionId}`)
    const result = await this.stripeClient.subscriptions.cancel(subscriptionId)
    if (result.status !== 'canceled') {
      Logger.log(`Subscription cancel attempt failed with status of ${result.id}: ${result.status}`)
      return
    }

    // the webhook will handle this as well.
    // but we cancel it here, in case the webhook is slow.
    const rd = await this.reacurringDonationService.findSubscriptionByExtId(result.id)
    if (rd) {
      return this.reacurringDonationService.cancel(rd.id)
    }
  }

  async findChargeById(chargeId: string): Promise<Stripe.Charge> {
    return await this.stripeClient.charges.retrieve(chargeId)
  }
}
