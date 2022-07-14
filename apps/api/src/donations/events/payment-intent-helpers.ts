import Stripe from 'stripe'

function getPaymentMethodId(paymentIntent: Stripe.PaymentIntent): string | 'none' {
  if (typeof paymentIntent.payment_method === 'string') {
    return paymentIntent.payment_method
  }
  return paymentIntent.payment_method?.id ?? 'none'
}

export type PaymentData = {
  paymentIntentId: string
  amount: number
  currency: string
  billingName?: string
  billingEmail?: string
  paymentMethodId?: string
  stripeCustomerId?: string
}

export function getPaymentData(paymentIntent: Stripe.PaymentIntent): PaymentData {
  const billingDetails = paymentIntent.charges.data.find(() => true)?.billing_details

  return {
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    billingName: billingDetails?.name ?? undefined,
    billingEmail: billingDetails?.email ?? paymentIntent.receipt_email ?? undefined,
    paymentMethodId: getPaymentMethodId(paymentIntent),
    stripeCustomerId: paymentIntent.customer as string | undefined,
  }
}
