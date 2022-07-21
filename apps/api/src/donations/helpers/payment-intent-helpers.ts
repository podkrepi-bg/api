import Stripe from 'stripe'
import { getCountryRegion, stripeFeeCalculator } from './stripe-fee-calculator'

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
}

export function getPaymentData(paymentIntent: Stripe.PaymentIntent): PaymentData {
  const billingDetails = paymentIntent.charges.data.find(() => true)?.billing_details
  const charges: Stripe.Charge[] = paymentIntent.charges.data as Stripe.Charge[]
  let country: string = ''
  if (charges.length === 1) {
    country = charges[0].payment_method_details?.card?.country ?? ''
  }

  return {
    paymentIntentId: paymentIntent.id,
    //netAmount is 0 until we receive a payment_intent.successful event where charges array contains the card country
    netAmount:
      charges.length === 0
        ? 0
        : paymentIntent.amount -
          stripeFeeCalculator(paymentIntent.amount, getCountryRegion(country)),
    chargedAmount: paymentIntent.amount,
    currency: paymentIntent.currency,
    billingName: billingDetails?.name ?? undefined,
    billingEmail: billingDetails?.email ?? paymentIntent.receipt_email ?? undefined,
    paymentMethodId: getPaymentMethodId(paymentIntent),
    stripeCustomerId: getPaymentCustomerId(paymentIntent),
  }
}
