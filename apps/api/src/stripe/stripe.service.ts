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
import {
  Campaign,
  Currency,
  DonationMetadata,
  Payment,
  RecurringDonationStatus,
} from '@prisma/client'
import { ConfigService } from '@nestjs/config'
import { InvoiceWithPayments, StripeMetadata } from './stripe-metadata.interface'
import { CreateStripePaymentDto } from '../donations/dto/create-stripe-payment.dto'
import { RecurringDonationService } from '../recurring-donation/recurring-donation.service'
import * as crypto from 'crypto'
import { RealmViewSupporters } from '@podkrepi-bg/podkrepi-types'
import { PrismaService } from '../prisma/prisma.service'
import { getFixedExchangeRate } from '../common/money'
import {
  ConvertSubscriptionsCurrencyDto,
  ConvertSubscriptionsCurrencyResponseDto,
  ConvertSingleSubscriptionCurrencyDto,
  SubscriptionConversionResultDto,
} from './dto/currency-conversion.dto'

@Injectable()
export class StripeService {
  constructor(
    @InjectStripeClient() private stripeClient: Stripe,
    private campaignService: CampaignService,
    private donationService: DonationsService,
    private configService: ConfigService,
    private prisma: PrismaService,
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
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
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
    return await this.stripeClient.setupIntents.create(
      { automatic_payment_methods: { enabled: true, allow_redirects: 'never' } },
      { idempotencyKey },
    )
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
        },
        metadata: {
          type: metadata.type,
          campaignId: metadata.campaignId,
          personId: metadata.personId,
          isAnonymous: metadata.isAnonymous,
        },
        // Stripe has a 4-level expansion limit. We expand to 4 levels:
        // 1. latest_invoice, 2. payments, 3. data, 4. payment
        // Then we'll access payment_intent without expansion (it will be a string ID)
        expand: ['latest_invoice.payments.data.payment'],
      },
      { idempotencyKey: `${idempotencyKey}--subscription` },
    )
    //include metadata in payment-intent
    // In API version 2025-03-31+, invoices have a 'payments' array instead of direct payment_intent field
    const invoice = subscription.latest_invoice as InvoiceWithPayments

    if (!invoice?.payments?.data || invoice.payments.data.length === 0) {
      throw new BadRequestException(
        `No payments found for subscription ${subscription.id}. The invoice may not have been created yet.`,
      )
    }

    const paymentIntentIdOrObject = invoice.payments.data[0]?.payment?.payment_intent

    if (!paymentIntentIdOrObject) {
      throw new BadRequestException(
        `Unable to retrieve payment intent for subscription ${subscription.id}. The payment data may not be available yet.`,
      )
    }

    // If payment_intent is a string ID, retrieve the full object
    // If it's already an object (shouldn't happen with 4-level expansion), use it directly
    const paymentIntent =
      typeof paymentIntentIdOrObject === 'string'
        ? await this.stripeClient.paymentIntents.retrieve(paymentIntentIdOrObject)
        : paymentIntentIdOrObject

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
    return await this.stripeClient.paymentIntents.create({
      ...inputDto,
      automatic_payment_methods: { allow_redirects: 'never', enabled: true },
    })
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

  async cancelSubscription(stripeSubscriptionId: string) {
    const result = await this.stripeClient.subscriptions.cancel(stripeSubscriptionId)
    return result
  }

  async findChargeById(chargeId: string): Promise<Stripe.Charge> {
    return await this.stripeClient.charges.retrieve(chargeId)
  }

  async retrieveSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return await this.stripeClient.subscriptions.retrieve(subscriptionId)
  }

  /**
   * List Stripe subscriptions with optional filters
   *
   * @param params - Stripe subscription list parameters (price, customer, status, etc.)
   * @returns Paginated list of subscriptions
   */
  async listSubscriptions(
    params?: Stripe.SubscriptionListParams,
  ): Promise<Stripe.ApiList<Stripe.Subscription>> {
    return await this.stripeClient.subscriptions.list(params)
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return await this.stripeClient.paymentIntents.retrieve(paymentIntentId)
  }

  async retrieveInvoice(invoiceId: string) {
    // In Stripe API version 2025-03-31 (Basil) and later, the charge and payment_intent
    // fields were removed from the Invoice object. Instead, invoices now have a 'payments'
    // array to support multiple partial payments.
    // Stripe has a 4-level expansion limit. We expand to 4 levels:
    // 1. payments, 2. data, 3. payment, 4. payment_intent
    // Then we'll access latest_charge without expansion (it will be a string ID)
    return await this.stripeClient.invoices.retrieve(invoiceId, {
      expand: ['payments.data.payment.payment_intent'],
    })
  }

  /**
   * Convert a single Stripe subscription from its current currency to a target currency
   *
   * @param subscriptionId - The Stripe subscription ID to convert
   * @param dto - Conversion parameters including target currency and options
   * @returns Conversion result with details
   */
  async convertSingleSubscriptionCurrency(
    subscriptionId: string,
    dto: ConvertSingleSubscriptionCurrencyDto,
  ): Promise<SubscriptionConversionResultDto> {
    Logger.log(
      `[Stripe] Converting single subscription ${subscriptionId} to ${dto.targetCurrency} ` +
        `(dryRun: ${dto.dryRun ?? false})`,
    )

    try {
      // Retrieve the subscription with expanded price data
      const subscription = await this.stripeClient.subscriptions.retrieve(subscriptionId, {
        expand: ['items.data.price'],
      })

      if (!subscription) {
        throw new NotFoundException(`Subscription ${subscriptionId} not found`)
      }

      // Get the subscription item and price
      const subscriptionItem = subscription.items.data[0]
      if (!subscriptionItem?.price) {
        return {
          subscriptionId,
          originalAmount: 0,
          convertedAmount: 0,
          originalCurrency: 'UNKNOWN',
          targetCurrency: dto.targetCurrency,
          success: false,
          errorMessage: 'No price data found for subscription',
          campaignId: subscription.metadata?.campaignId,
        }
      }

      const price = subscriptionItem.price
      const originalCurrency = price.currency.toUpperCase()
      const originalAmount = price.unit_amount ?? 0

      // Skip if already in target currency
      if (originalCurrency === dto.targetCurrency) {
        return {
          subscriptionId,
          originalAmount,
          convertedAmount: originalAmount,
          originalCurrency,
          targetCurrency: dto.targetCurrency,
          success: true,
          campaignId: subscription.metadata?.campaignId,
        }
      }

      // Determine exchange rate
      const exchangeRate =
        dto.exchangeRate ?? getFixedExchangeRate(originalCurrency, dto.targetCurrency)

      if (!exchangeRate) {
        return {
          subscriptionId,
          originalAmount,
          convertedAmount: 0,
          originalCurrency,
          targetCurrency: dto.targetCurrency,
          success: false,
          errorMessage: `No exchange rate available for ${originalCurrency} to ${dto.targetCurrency}. Please provide a custom exchangeRate.`,
          campaignId: subscription.metadata?.campaignId,
        }
      }

      // Convert amount (amounts are in cents)
      const convertedAmount = Math.round(originalAmount * exchangeRate)

      if (!dto.dryRun) {
        // Update the subscription in Stripe (returns new subscription ID)
        const newSubscriptionId = await this.updateSubscriptionCurrency(
          subscription,
          subscriptionItem,
          dto.targetCurrency.toLowerCase(),
          convertedAmount,
        )

        // Update local recurring donation record with new subscription ID
        await this.updateLocalRecurringDonation(
          subscriptionId,
          newSubscriptionId,
          dto.targetCurrency,
          convertedAmount,
        )
      }

      Logger.log(
        `[Stripe] Successfully converted subscription ${subscriptionId}: ` +
          `${originalCurrency} ${originalAmount} -> ${dto.targetCurrency} ${convertedAmount}`,
      )

      return {
        subscriptionId,
        originalAmount,
        convertedAmount,
        originalCurrency,
        targetCurrency: dto.targetCurrency,
        success: true,
        campaignId: subscription.metadata?.campaignId,
      }
    } catch (error) {
      Logger.error(
        `[Stripe] Failed to convert subscription ${subscriptionId}: ${error.message}`,
        error.stack,
      )

      if (error instanceof NotFoundException) {
        throw error
      }

      return {
        subscriptionId,
        originalAmount: 0,
        convertedAmount: 0,
        originalCurrency: 'UNKNOWN',
        targetCurrency: dto.targetCurrency,
        success: false,
        errorMessage: error.message,
      }
    }
  }

  /**
   * Convert all Stripe subscriptions from one currency to another
   * Designed for Bulgaria's 2026 EUR adoption (BGN to EUR migration)
   *
   * This method:
   * 1. Fetches all active subscriptions from Stripe (paginated)
   * 2. Filters to those matching the source currency
   * 3. Converts the amount using the provided or fixed exchange rate
   * 4. Updates each subscription in Stripe with the new currency and amount
   * 5. Updates the corresponding local RecurringDonation records
   * 6. Returns detailed statistics and results
   *
   * @param dto - Conversion parameters including source/target currencies and options
   * @returns Conversion results with statistics
   */
  async convertSubscriptionsCurrency(
    dto: ConvertSubscriptionsCurrencyDto,
  ): Promise<ConvertSubscriptionsCurrencyResponseDto> {
    const startedAt = new Date()
    const results: SubscriptionConversionResultDto[] = []

    // Determine exchange rate
    const exchangeRate =
      dto.exchangeRate ?? getFixedExchangeRate(dto.sourceCurrency, dto.targetCurrency)

    if (!exchangeRate) {
      throw new BadRequestException(
        `No exchange rate available for ${dto.sourceCurrency} to ${dto.targetCurrency}. ` +
          `Please provide a custom exchangeRate.`,
      )
    }

    const batchSize = dto.batchSize ?? 100
    let totalFound = 0
    let successCount = 0
    let failedCount = 0
    let skippedCount = 0

    // Rate limiting: delay between API calls to avoid hitting Stripe rate limits
    // Stripe allows ~100 requests/second in live mode, ~25/second in test mode
    const delayBetweenConversions = dto.delayMs ?? 100 // milliseconds between each conversion

    Logger.log(
      `[Stripe] Starting bulk currency conversion: ${dto.sourceCurrency} -> ${dto.targetCurrency} ` +
        `(rate: ${exchangeRate}, dryRun: ${
          dto.dryRun ?? false
        }, delay: ${delayBetweenConversions}ms)`,
    )

    // Helper function to add delay
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    try {
      // Fetch subscriptions with pagination
      // Include both 'active' and 'trialing' statuses as both represent valid recurring donations
      const statusesToConvert: Stripe.SubscriptionListParams['status'][] = ['active', 'trialing']

      for (const status of statusesToConvert) {
        let hasMore = true
        let startingAfter: string | undefined = undefined

        Logger.debug(`[Stripe] Fetching subscriptions with status: ${status}`)

        while (hasMore) {
          const listParams: Stripe.SubscriptionListParams = {
            limit: batchSize,
            status,
            expand: ['data.items.data.price'],
            ...(startingAfter && { starting_after: startingAfter }),
          }

          const subscriptions = await this.listSubscriptions(listParams)

          for (const subscription of subscriptions.data) {
            const result = await this.processSubscriptionConversion(
              subscription,
              dto.sourceCurrency,
              dto.targetCurrency,
              exchangeRate,
              dto.dryRun ?? false,
            )

            results.push(result)
            totalFound++

            if (result.success) {
              if (result.originalCurrency !== dto.sourceCurrency) {
                skippedCount++ // Not matching source currency
              } else if (result.originalCurrency === dto.targetCurrency) {
                skippedCount++ // Already in target currency
              } else {
                successCount++
              }
            } else {
              failedCount++
            }

            // Add delay between conversions to respect Stripe rate limits
            // Only delay for actual conversions (not dry runs and not skipped)
            if (!dto.dryRun && result.success && result.originalCurrency === dto.sourceCurrency) {
              await delay(delayBetweenConversions)
            }
          }

          hasMore = subscriptions.has_more
          if (subscriptions.data.length > 0) {
            startingAfter = subscriptions.data[subscriptions.data.length - 1].id
          }
        }
      }
    } catch (error) {
      Logger.error(`[Stripe] Currency conversion failed: ${error.message}`, error.stack)
      throw new BadRequestException(`Currency conversion failed: ${error.message}`)
    }

    const completedAt = new Date()

    Logger.log(
      `[Stripe] Bulk currency conversion completed. ` +
        `Total: ${totalFound}, Success: ${successCount}, Failed: ${failedCount}, Skipped: ${skippedCount}`,
    )

    return {
      totalFound,
      successCount,
      failedCount,
      skippedCount,
      exchangeRate,
      sourceCurrency: dto.sourceCurrency,
      targetCurrency: dto.targetCurrency,
      dryRun: dto.dryRun ?? false,
      results,
      startedAt,
      completedAt,
    }
  }

  /**
   * Process a single subscription conversion (used internally by bulk conversion)
   */
  private async processSubscriptionConversion(
    subscription: Stripe.Subscription,
    sourceCurrency: Currency,
    targetCurrency: Currency,
    exchangeRate: number,
    dryRun: boolean,
  ): Promise<SubscriptionConversionResultDto> {
    const subscriptionId = subscription.id
    const campaignId = subscription.metadata?.campaignId

    try {
      // Get the subscription item and price
      const subscriptionItem = subscription.items.data[0]
      if (!subscriptionItem?.price) {
        return {
          subscriptionId,
          originalAmount: 0,
          convertedAmount: 0,
          originalCurrency: sourceCurrency,
          targetCurrency,
          success: false,
          errorMessage: 'No price data found for subscription',
          campaignId,
        }
      }

      const price = subscriptionItem.price
      const originalCurrency = price.currency.toUpperCase()
      const originalAmount = price.unit_amount ?? 0

      // Skip if not in source currency
      if (originalCurrency !== sourceCurrency) {
        return {
          subscriptionId,
          originalAmount,
          convertedAmount: originalAmount,
          originalCurrency,
          targetCurrency,
          success: true, // Not an error, just not applicable
          campaignId,
        }
      }

      // Skip if already in target currency
      if (originalCurrency === targetCurrency) {
        return {
          subscriptionId,
          originalAmount,
          convertedAmount: originalAmount,
          originalCurrency,
          targetCurrency,
          success: true,
          campaignId,
        }
      }

      // Convert amount (amounts are in cents)
      const convertedAmount = Math.round(originalAmount * exchangeRate)

      if (!dryRun) {
        // Mark the local recurring donation as pending conversion BEFORE canceling
        // This prevents the webhook from marking it as canceled when the old subscription is deleted
        await this.markRecurringDonationForConversion(subscriptionId)

        // Update the subscription in Stripe (returns new subscription ID)
        const newSubscriptionId = await this.updateSubscriptionCurrency(
          subscription,
          subscriptionItem,
          targetCurrency.toLowerCase(),
          convertedAmount,
        )

        // Update local recurring donation record with new subscription ID
        await this.updateLocalRecurringDonation(
          subscriptionId,
          newSubscriptionId,
          targetCurrency,
          convertedAmount,
        )
      }

      return {
        subscriptionId,
        originalAmount,
        convertedAmount,
        originalCurrency,
        targetCurrency,
        success: true,
        campaignId,
      }
    } catch (error) {
      Logger.error(
        `[Stripe] Failed to convert subscription ${subscriptionId}: ${error.message}`,
        error.stack,
      )
      return {
        subscriptionId,
        originalAmount: 0,
        convertedAmount: 0,
        originalCurrency: sourceCurrency,
        targetCurrency,
        success: false,
        errorMessage: error.message,
        campaignId,
      }
    }
  }

  /**
   * Convert subscription to new currency by canceling immediately and creating a new one.
   *
   * Stripe subscriptions have an immutable currency field, so we cannot update in-place.
   * Additionally, Stripe doesn't allow customers to have active subscriptions in multiple
   * currencies simultaneously.
   *
   * Instead, we:
   * 1. Cancel the old subscription immediately
   * 2. Create a new subscription in the target currency with a trial period
   *    that covers the remaining time from the old subscription (so customer
   *    doesn't lose any paid time)
   *
   * This maintains the billing cycle alignment and ensures the customer gets
   * the full value of their current period.
   *
   * @returns The new subscription ID
   */
  private async updateSubscriptionCurrency(
    subscription: Stripe.Subscription,
    subscriptionItem: Stripe.SubscriptionItem,
    newCurrency: string,
    newAmount: number,
  ): Promise<string> {
    const price = subscriptionItem.price
    const customerId =
      typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id
    const productId = typeof price.product === 'string' ? price.product : price.product.id

    // Get the period end timestamp for the billing cycle alignment
    // In Stripe API v20+, current_period_end is on the SubscriptionItem, not the Subscription
    const periodEnd = subscriptionItem.current_period_end

    // Store conversion metadata for audit trail
    const conversionMetadata = {
      ...subscription.metadata,
      currencyConvertedFrom: price.currency.toUpperCase(),
      currencyConvertedTo: newCurrency.toUpperCase(),
      currencyConvertedAt: new Date().toISOString(),
      originalAmount: String(price.unit_amount),
      originalSubscriptionId: subscription.id,
      originalPeriodEnd: new Date(periodEnd * 1000).toISOString(),
    }

    // Cancel the old subscription immediately
    // We need to cancel immediately because Stripe doesn't allow customers to have
    // active subscriptions in multiple currencies at the same time
    try {
      await this.stripeClient.subscriptions.cancel(subscription.id, {
        prorate: false, // Don't create prorated credit, we'll use trial instead
        cancellation_details: {
          comment: `currency_conversion:${newCurrency.toUpperCase()}`,
        },
      })
    } catch (error) {
      // If the subscription is already canceled, that's fine - continue with creating the new one
      if (error.code === 'resource_missing' || error.message?.includes('already been canceled')) {
        Logger.warn(
          `[Stripe] Subscription ${subscription.id} was already canceled. Continuing with new subscription creation.`,
        )
      } else {
        Logger.error(`[Stripe] Failed to cancel subscription ${subscription.id}: ${error.message}`)
        throw new Error(`Failed to cancel subscription: ${error.message}`)
      }
    }

    Logger.debug(
      `[Stripe] Canceled subscription ${subscription.id} immediately for currency conversion. ` +
        `Original period end was ${new Date(periodEnd * 1000).toISOString()}`,
    )

    // Step 3: Create new subscription in target currency
    // Use trial_end set to the original period end to compensate for remaining time
    // This way the customer doesn't lose any paid time from the old subscription
    let newSubscription: Stripe.Subscription
    try {
      newSubscription = await this.stripeClient.subscriptions.create({
        customer: customerId,
        items: [
          {
            price_data: {
              currency: newCurrency,
              product: productId,
              unit_amount: newAmount,
              recurring: {
                interval: price.recurring?.interval ?? 'month',
                interval_count: price.recurring?.interval_count ?? 1,
              },
            },
          },
        ],
        metadata: conversionMetadata,
        // Trial until the original period end - customer gets remaining time for free
        trial_end: periodEnd,
        proration_behavior: 'none',
        // Copy payment settings from old subscription if available
        ...(subscription.default_payment_method && {
          default_payment_method:
            typeof subscription.default_payment_method === 'string'
              ? subscription.default_payment_method
              : subscription.default_payment_method.id,
        }),
      })
    } catch (error) {
      Logger.error(
        `[Stripe] Failed to create new subscription for customer ${customerId}: ${error.message}`,
      )
      throw new Error(
        `Failed to create new subscription in ${newCurrency.toUpperCase()}: ${error.message}`,
      )
    }

    Logger.log(
      `[Stripe] Currency conversion complete: ${subscription.id} -> ${newSubscription.id}. ` +
        `${price.currency.toUpperCase()} ${price.unit_amount} -> ` +
        `${newCurrency.toUpperCase()} ${newAmount}. ` +
        `New subscription in trial until ${new Date(periodEnd * 1000).toISOString()} ` +
        `(compensating for remaining time on old subscription)`,
    )

    return newSubscription.id
  }

  /**
   * Update the local RecurringDonation record to match the converted subscription
   */
  private async updateLocalRecurringDonation(
    oldSubscriptionId: string,
    newSubscriptionId: string,
    newCurrency: Currency,
    newAmount: number,
  ): Promise<void> {
    // First check for the 'converting:' prefix since that's what markRecurringDonationForConversion sets
    const convertingRecord = await this.prisma.recurringDonation.findFirst({
      where: { extSubscriptionId: `converting:${oldSubscriptionId}` },
    })

    if (convertingRecord) {
      await this.prisma.recurringDonation.update({
        where: { id: convertingRecord.id },
        data: {
          extSubscriptionId: newSubscriptionId,
          currency: newCurrency,
          amount: newAmount,
          // Set status to active - the Stripe "trial" is just a technical mechanism
          // to preserve the billing cycle, not an actual trial period
          status: RecurringDonationStatus.active,
        },
      })
      Logger.debug(
        `[Stripe] Updated recurring donation ${convertingRecord.id}: ` +
          `subscription converting:${oldSubscriptionId} -> ${newSubscriptionId}, ` +
          `currency -> ${newCurrency}, amount -> ${newAmount}, status -> active`,
      )
      return
    }

    // Fallback: check for old subscription ID directly (in case markRecurringDonationForConversion
    // was skipped or failed)
    const recurringDonation = await this.prisma.recurringDonation.findFirst({
      where: { extSubscriptionId: oldSubscriptionId },
    })

    if (recurringDonation) {
      await this.prisma.recurringDonation.update({
        where: { id: recurringDonation.id },
        data: {
          extSubscriptionId: newSubscriptionId,
          currency: newCurrency,
          amount: newAmount,
          status: RecurringDonationStatus.active,
        },
      })
      Logger.debug(
        `[Stripe] Updated recurring donation ${recurringDonation.id}: ` +
          `subscription ${oldSubscriptionId} -> ${newSubscriptionId}, ` +
          `currency -> ${newCurrency}, amount -> ${newAmount}, status -> active`,
      )
      return
    }

    Logger.warn(
      `[Stripe] No local recurring donation found for subscription ${oldSubscriptionId} ` +
        `(checked both 'converting:${oldSubscriptionId}' and '${oldSubscriptionId}')`,
    )
  }

  /**
   * Mark a recurring donation as pending currency conversion.
   * This is done BEFORE canceling the subscription in Stripe, so that when the
   * webhook fires for the deleted subscription, we know to skip the status update.
   */
  private async markRecurringDonationForConversion(subscriptionId: string): Promise<void> {
    // First check if it's already marked for conversion (from a previous attempt)
    const alreadyConverting = await this.prisma.recurringDonation.findFirst({
      where: { extSubscriptionId: `converting:${subscriptionId}` },
    })

    if (alreadyConverting) {
      Logger.debug(
        `[Stripe] Recurring donation ${alreadyConverting.id} already marked for conversion ` +
          `(subscription ${subscriptionId})`,
      )
      return
    }

    const recurringDonation = await this.prisma.recurringDonation.findFirst({
      where: { extSubscriptionId: subscriptionId },
    })

    if (recurringDonation) {
      await this.prisma.recurringDonation.update({
        where: { id: recurringDonation.id },
        data: {
          // Prefix with 'converting:' to mark as pending conversion
          extSubscriptionId: `converting:${subscriptionId}`,
        },
      })
      Logger.debug(
        `[Stripe] Marked recurring donation ${recurringDonation.id} for currency conversion ` +
          `(subscription ${subscriptionId})`,
      )
    } else {
      Logger.warn(
        `[Stripe] No recurring donation found to mark for conversion (subscription ${subscriptionId})`,
      )
    }
  }
}
