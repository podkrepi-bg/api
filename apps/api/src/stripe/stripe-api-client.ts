import { InjectStripeClient } from '@golevelup/nestjs-stripe'
import { Injectable } from '@nestjs/common'
import Stripe from 'stripe'

/**
 * Gateway for the Stripe SDK. Every Stripe API call in this codebase should go
 * through this class — no other file should call `stripeClient.X.Y(...)` directly.
 *
 * Why this exists:
 * 1. Single grep target for "what does this app do with Stripe."
 * 2. Single place to add cross-cutting concerns (logging, error mapping).
 * 3. Probe-able in isolation: a CI script can instantiate this class with a
 *    test-mode restricted key and call every method to verify the key has all
 *    required scopes — catching local-vs-prod permission drift before deploy.
 *
 * Methods are intentionally thin — orchestration, validation, idempotency-key
 * generation, and DB lookups belong in StripeService, not here. Each method
 * forwards to exactly one Stripe SDK call and accepts Stripe SDK types directly.
 */
@Injectable()
export class StripeApiClient {
  constructor(@InjectStripeClient() private readonly stripe: Stripe) {}

  // SetupIntents
  createSetupIntent(params: Stripe.SetupIntentCreateParams, options?: Stripe.RequestOptions) {
    return this.stripe.setupIntents.create(params, options)
  }
  updateSetupIntent(
    id: string,
    params: Stripe.SetupIntentUpdateParams,
    options?: Stripe.RequestOptions,
  ) {
    return this.stripe.setupIntents.update(id, params, options)
  }
  cancelSetupIntent(id: string) {
    return this.stripe.setupIntents.cancel(id)
  }
  retrieveSetupIntent(id: string, params?: Stripe.SetupIntentRetrieveParams) {
    return this.stripe.setupIntents.retrieve(id, params)
  }

  // PaymentIntents
  createPaymentIntent(
    params: Stripe.PaymentIntentCreateParams,
    options?: Stripe.RequestOptions,
  ) {
    return this.stripe.paymentIntents.create(params, options)
  }
  updatePaymentIntent(id: string, params: Stripe.PaymentIntentUpdateParams) {
    return this.stripe.paymentIntents.update(id, params)
  }
  cancelPaymentIntent(id: string, params: Stripe.PaymentIntentCancelParams) {
    return this.stripe.paymentIntents.cancel(id, params)
  }
  retrievePaymentIntent(id: string) {
    return this.stripe.paymentIntents.retrieve(id)
  }

  // PaymentMethods
  listPaymentMethods(params: Stripe.PaymentMethodListParams) {
    return this.stripe.paymentMethods.list(params)
  }
  attachPaymentMethod(
    id: string,
    params: Stripe.PaymentMethodAttachParams,
    options?: Stripe.RequestOptions,
  ) {
    return this.stripe.paymentMethods.attach(id, params, options)
  }

  // Customers
  listCustomers(params: Stripe.CustomerListParams) {
    return this.stripe.customers.list(params)
  }
  createCustomer(params: Stripe.CustomerCreateParams, options?: Stripe.RequestOptions) {
    return this.stripe.customers.create(params, options)
  }

  // Products
  searchProducts(params: Stripe.ProductSearchParams) {
    return this.stripe.products.search(params)
  }
  createProduct(params: Stripe.ProductCreateParams, options?: Stripe.RequestOptions) {
    return this.stripe.products.create(params, options)
  }

  // Subscriptions
  createSubscription(params: Stripe.SubscriptionCreateParams, options?: Stripe.RequestOptions) {
    return this.stripe.subscriptions.create(params, options)
  }
  cancelSubscription(id: string, params?: Stripe.SubscriptionCancelParams) {
    return this.stripe.subscriptions.cancel(id, params)
  }
  retrieveSubscription(id: string, params?: Stripe.SubscriptionRetrieveParams) {
    return this.stripe.subscriptions.retrieve(id, params)
  }
  listSubscriptions(params?: Stripe.SubscriptionListParams) {
    return this.stripe.subscriptions.list(params)
  }

  // Prices
  listPrices(params: Stripe.PriceListParams) {
    return this.stripe.prices.list(params)
  }

  // Checkout
  createCheckoutSession(params: Stripe.Checkout.SessionCreateParams) {
    return this.stripe.checkout.sessions.create(params)
  }

  // Refunds
  createRefund(params: Stripe.RefundCreateParams) {
    return this.stripe.refunds.create(params)
  }

  // Charges
  retrieveCharge(id: string) {
    return this.stripe.charges.retrieve(id)
  }

  // Invoices
  retrieveInvoice(id: string, params?: Stripe.InvoiceRetrieveParams) {
    return this.stripe.invoices.retrieve(id, params)
  }
}
