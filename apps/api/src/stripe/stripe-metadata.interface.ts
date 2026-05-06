import { DonationType } from '@prisma/client'
import Stripe from 'stripe'

export interface StripeMetadata extends Stripe.MetadataParam {
  type: DonationType | null
  campaignId: string | null
  personId: string | null
  isAnonymous: string | null
  wish: string | null
}

/**
 * Extended Invoice type for Stripe API version 2025-03-31+
 * In newer API versions, invoices have a 'payments' array instead of direct payment_intent field
 */
export type InvoiceWithPayments = Stripe.Invoice & {
  payments?: {
    data: Array<{
      payment?: {
        payment_intent?: string | Stripe.PaymentIntent
      }
    }>
  }
}
