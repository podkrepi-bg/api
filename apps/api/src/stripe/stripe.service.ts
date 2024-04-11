import { InjectStripeClient } from '@golevelup/nestjs-stripe'
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import Stripe from 'stripe'
import { UpdateSetupIntentDto } from './dto/update-setup-intent.dto'
import { KeycloakTokenParsed } from '../auth/keycloak'
import { CreateSubscriptionPaymentDto } from './dto/create-subscription-payment.dto'
import { CampaignService } from '../campaign/campaign.service'
import { PersonService } from '../person/person.service'

@Injectable()
export class StripeService {
  constructor(
    @InjectStripeClient() private stripeClient: Stripe,
    private personService: PersonService,
    private campaignService: CampaignService,
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
    return await this.stripeClient.setupIntents.update(id, inputDto)
  }
  /**
   * Create a payment intent for a donation
   * https://stripe.com/docs/api/payment_intents/create
   * @param inputDto Payment intent create params
   * @returns {Promise<Stripe.Response<Stripe.PaymentIntent>>}
   */
  async finalizeSetupIntent(setupIntentId: string): Promise<Stripe.PaymentIntent> {
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
    const email = paymentMethod.billing_details.email

    let customer = await this.stripeClient.customers
      .list({
        email,
      })
      .then((res) => res.data.at(0))
    if (!customer) {
      customer = await this.stripeClient.customers.create({
        email,
        payment_method: paymentMethod.id,
      })
    }
    this.stripeClient.paymentMethods.attach(paymentMethod.id, {
      customer: customer.id,
    })
    const paymentIntent = await this.stripeClient.paymentIntents.create({
      amount: Math.round(Number(setupIntent.metadata.amount)),
      currency: setupIntent.metadata.currency,
      customer: customer.id,
      payment_method: setupIntent.payment_method.id,
      confirm: true,
      metadata: {
        ...setupIntent.metadata,
      },
    })
    return paymentIntent
  }
  /**
   * Create a setup intent for a donation
   * @param inputDto Payment intent create params
   * @returns {Promise<Stripe.Response<Stripe.PaymentIntent>>}
   */
  async createSetupIntent(): Promise<Stripe.Response<Stripe.SetupIntent>> {
    return await this.stripeClient.setupIntents.create()
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

  async createCustomer(
    user: KeycloakTokenParsed,
    subscriptionPaymentDto: CreateSubscriptionPaymentDto,
  ) {
    const person = await this.personService.findOneByKeycloakId(user.sub)
    if (!person || !person.email)
      throw new NotFoundException(`No person found with keycloakid: ${user.sub}`)
    const customer = await this.stripeClient.customers.create({
      email: person.email,
      name: 'JOHN DOE',
      metadata: {
        keycloakId: user.sub,
        person: person.id,
      },
    })
    return customer
  }

  async createProduct(subscriptionPaymentDto: CreateSubscriptionPaymentDto) {
    const campaign = await this.campaignService.validateCampaignId(
      subscriptionPaymentDto.campaignId,
    )
    if (!campaign)
      throw new Error(`Campaign with id ${subscriptionPaymentDto.campaignId} not found`)

    const product = await this.stripeClient.products.create({
      name: campaign.title,
      description: `Recurring donation for ${campaign.title} by person ${subscriptionPaymentDto.email}`,
    })
    return product
  }
  async createSubscription(
    user: KeycloakTokenParsed,
    subscriptionPaymentDto: CreateSubscriptionPaymentDto,
  ): Promise<Stripe.PaymentIntent> {
    const customer = await this.createCustomer(user, subscriptionPaymentDto)
    const product = await this.createProduct(subscriptionPaymentDto)
    const subscription = await this.stripeClient.subscriptions.create({
      customer: customer.id,
      items: [
        {
          price_data: {
            unit_amount: Math.round(subscriptionPaymentDto.amount),
            currency: subscriptionPaymentDto.currency,
            product: product.id,
            recurring: { interval: 'month' },
          },
        },
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
        payment_method_types: ['card'],
      },
      metadata: {
        type: subscriptionPaymentDto.type,
        campaignId: subscriptionPaymentDto.campaignId,
        personId: customer.metadata.person,
        amount: Math.round(subscriptionPaymentDto.amount),
      },

      expand: ['latest_invoice.payment_intent'],
    })
    const invoice = subscription.latest_invoice as Stripe.Invoice
    return invoice.payment_intent as Stripe.PaymentIntent
  }
}
