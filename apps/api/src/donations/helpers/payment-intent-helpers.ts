import { PaymentProvider } from '@prisma/client'
import Stripe from 'stripe'
import { getCountryRegion, stripeFeeCalculator } from './stripe-fee-calculator'
import { RecurringDonationStatus, Currency } from '@prisma/client'

function getPaymentMethodId(paymentIntent: Stripe.PaymentIntent): string | undefined {
  if (typeof paymentIntent.payment_method === 'string') {
    return paymentIntent.payment_method
  }
  return paymentIntent.payment_method?.id ?? undefined
}

function getPaymentCustomerId(paymentIntent: Stripe.PaymentIntent): string | undefined {
  if (typeof paymentIntent.customer === 'string') {
    return paymentIntent.customer
  }
  return paymentIntent.customer?.id ?? undefined
}

export type PaymentData = {
  paymentIntentId: string
  netAmount: number
  chargedAmount: number
  currency: string
  billingName?: string
  billingEmail?: string
  paymentMethodId?: string
  stripeCustomerId?: string
  paymentProvider: PaymentProvider
  personId?: string
}

export function getPaymentData(
  paymentIntent: Stripe.PaymentIntent,
  charge?: Stripe.Charge,
): PaymentData {
  return {
    paymentProvider: PaymentProvider.stripe,
    paymentIntentId: paymentIntent.id,
    //netAmount is 0 until we receive a payment_intent.successful event where charges array contains the card country
    netAmount: !paymentIntent.latest_charge
      ? 0
      : Math.round(
          paymentIntent.amount -
            stripeFeeCalculator(
              paymentIntent.amount,
              getCountryRegion(charge?.payment_method_details?.card?.country as string),
            ),
        ),
    chargedAmount: paymentIntent.amount,
    currency: paymentIntent.currency,
    billingName: charge?.billing_details?.name ?? undefined,
    billingEmail: charge?.billing_details?.email ?? paymentIntent.receipt_email ?? undefined,
    paymentMethodId: getPaymentMethodId(paymentIntent),
    stripeCustomerId: getPaymentCustomerId(paymentIntent),
  }
}

export function getInvoiceData(invoice: Stripe.Invoice): PaymentData {
  const lines: Stripe.InvoiceLineItem[] = invoice.lines.data as Stripe.InvoiceLineItem[]
  const country = invoice.account_country as string

  let personId = ''
  lines.map((line) => {
    if (line.metadata.personId) {
      personId = line.metadata.personId
    }
  })

  return {
    paymentProvider: PaymentProvider.stripe,
    paymentIntentId: invoice.payment_intent as string,
    //netAmount is 0 until we receive a payment_intent.successful event where charges array contains the card country
    netAmount:
      lines.length === 0
        ? 0
        : Math.round(
            invoice.amount_paid -
              stripeFeeCalculator(invoice.amount_paid, getCountryRegion(country)),
          ),
    chargedAmount: invoice.amount_paid,
    currency: invoice.currency.toUpperCase(),
    billingName: invoice.account_name ?? undefined,
    billingEmail: invoice.customer_email ?? undefined,
    paymentMethodId: invoice.collection_method,
    stripeCustomerId: invoice.customer as string,
    personId,
  }
}

export function string2RecurringDonationStatus(status: string): RecurringDonationStatus {
  switch (status) {
    case 'active':
      return RecurringDonationStatus.active
    case 'canceled':
      return RecurringDonationStatus.canceled
    case 'incomplete':
      return RecurringDonationStatus.incomplete
    case 'incomplete_expired':
      return RecurringDonationStatus.incompleteExpired
    case 'trialing':
      return RecurringDonationStatus.trialing
    case 'past_due':
      return RecurringDonationStatus.pastDue
    case 'unpaid':
      return RecurringDonationStatus.unpaid
    default:
      return RecurringDonationStatus.active
  }
}

export function string2Currency(currency: string): Currency {
  switch (currency.toUpperCase()) {
    case 'BGN':
      return Currency.BGN
    case 'EUR':
      return Currency.EUR
    case 'USD':
      return Currency.USD
    default:
      return Currency.BGN
  }
}
