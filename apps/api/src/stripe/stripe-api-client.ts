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
 *
 * Signature rule: every method mirrors the underlying SDK signature as
 * `(id?, params?, options?: Stripe.RequestOptions)`. The `options` slot is
 * always present so callers can pass `idempotencyKey`, `stripeAccount`,
 * per-call `timeout`, etc. without having to edit the gateway first.
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
  cancelSetupIntent(
    id: string,
    params?: Stripe.SetupIntentCancelParams,
    options?: Stripe.RequestOptions,
  ) {
    return this.stripe.setupIntents.cancel(id, params, options)
  }
  retrieveSetupIntent(
    id: string,
    params?: Stripe.SetupIntentRetrieveParams,
    options?: Stripe.RequestOptions,
  ) {
    return this.stripe.setupIntents.retrieve(id, params, options)
  }

  // PaymentIntents
  createPaymentIntent(params: Stripe.PaymentIntentCreateParams, options?: Stripe.RequestOptions) {
    return this.stripe.paymentIntents.create(params, options)
  }
  updatePaymentIntent(
    id: string,
    params: Stripe.PaymentIntentUpdateParams,
    options?: Stripe.RequestOptions,
  ) {
    return this.stripe.paymentIntents.update(id, params, options)
  }
  cancelPaymentIntent(
    id: string,
    params?: Stripe.PaymentIntentCancelParams,
    options?: Stripe.RequestOptions,
  ) {
    return this.stripe.paymentIntents.cancel(id, params, options)
  }
  retrievePaymentIntent(
    id: string,
    params?: Stripe.PaymentIntentRetrieveParams,
    options?: Stripe.RequestOptions,
  ) {
    return this.stripe.paymentIntents.retrieve(id, params, options)
  }

  // PaymentMethods
  listPaymentMethods(params: Stripe.PaymentMethodListParams, options?: Stripe.RequestOptions) {
    return this.stripe.paymentMethods.list(params, options)
  }
  attachPaymentMethod(
    id: string,
    params: Stripe.PaymentMethodAttachParams,
    options?: Stripe.RequestOptions,
  ) {
    return this.stripe.paymentMethods.attach(id, params, options)
  }

  // Customers
  listCustomers(params: Stripe.CustomerListParams, options?: Stripe.RequestOptions) {
    return this.stripe.customers.list(params, options)
  }
  createCustomer(params: Stripe.CustomerCreateParams, options?: Stripe.RequestOptions) {
    return this.stripe.customers.create(params, options)
  }

  // Products
  searchProducts(params: Stripe.ProductSearchParams, options?: Stripe.RequestOptions) {
    return this.stripe.products.search(params, options)
  }
  createProduct(params: Stripe.ProductCreateParams, options?: Stripe.RequestOptions) {
    return this.stripe.products.create(params, options)
  }

  // Subscriptions
  createSubscription(params: Stripe.SubscriptionCreateParams, options?: Stripe.RequestOptions) {
    return this.stripe.subscriptions.create(params, options)
  }
  cancelSubscription(
    id: string,
    params?: Stripe.SubscriptionCancelParams,
    options?: Stripe.RequestOptions,
  ) {
    return this.stripe.subscriptions.cancel(id, params, options)
  }
  retrieveSubscription(
    id: string,
    params?: Stripe.SubscriptionRetrieveParams,
    options?: Stripe.RequestOptions,
  ) {
    return this.stripe.subscriptions.retrieve(id, params, options)
  }
  listSubscriptions(params?: Stripe.SubscriptionListParams, options?: Stripe.RequestOptions) {
    return this.stripe.subscriptions.list(params, options)
  }

  // Prices
  listPrices(params: Stripe.PriceListParams, options?: Stripe.RequestOptions) {
    return this.stripe.prices.list(params, options)
  }

  // Checkout
  createCheckoutSession(
    params: Stripe.Checkout.SessionCreateParams,
    options?: Stripe.RequestOptions,
  ) {
    return this.stripe.checkout.sessions.create(params, options)
  }

  // Refunds
  createRefund(params: Stripe.RefundCreateParams, options?: Stripe.RequestOptions) {
    return this.stripe.refunds.create(params, options)
  }

  // Charges
  retrieveCharge(
    id: string,
    params?: Stripe.ChargeRetrieveParams,
    options?: Stripe.RequestOptions,
  ) {
    return this.stripe.charges.retrieve(id, params, options)
  }

  // Webhook Endpoints
  listWebhookEndpoints(
    params?: Stripe.WebhookEndpointListParams,
    options?: Stripe.RequestOptions,
  ) {
    return this.stripe.webhookEndpoints.list(params, options)
  }

  // Invoices
  retrieveInvoice(
    id: string,
    params?: Stripe.InvoiceRetrieveParams,
    options?: Stripe.RequestOptions,
  ) {
    return this.stripe.invoices.retrieve(id, params, options)
  }
}
