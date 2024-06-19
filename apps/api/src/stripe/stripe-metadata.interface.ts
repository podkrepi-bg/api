import { DonationType } from '@prisma/client'
import Stripe from 'stripe'

export interface StripeMetadata extends Stripe.MetadataParam {
  type: DonationType | null
  campaignId: string | null
  personId: string | null
  isAnonymous: string | null
  wish: string | null
}
