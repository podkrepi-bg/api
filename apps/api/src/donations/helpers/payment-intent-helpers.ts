import { PaymentProvider } from '@prisma/client'
import Stripe from 'stripe'
import { getCountryRegion, stripeFeeCalculator } from './stripe-fee-calculator'
import { RecurringDonationStatus, Currency } from '@prisma/client'

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

export function getPaymentDataFromCharge(charge: Stripe.Charge): PaymentData {
  return {
    paymentProvider: PaymentProvider.stripe,
    paymentIntentId: charge.payment_intent as string,
    //netAmount is 0 until we receive a payment_intent.successful event where charges array contains the card country
    netAmount: Math.round(
      charge.amount -
        stripeFeeCalculator(
          charge.amount,
          getCountryRegion(charge?.payment_method_details?.card?.country as string),
        ),
    ),
    chargedAmount: charge.amount,
    currency: charge.currency,
    billingName: charge?.billing_details?.name ?? undefined,
    billingEmail: charge?.billing_details?.email ?? charge.receipt_email ?? undefined,
    paymentMethodId: charge.payment_method ?? undefined,
    stripeCustomerId: (charge.customer as string) ?? undefined,
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
