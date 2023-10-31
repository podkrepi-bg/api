import { DonationType } from '@prisma/client'
import Stripe from 'stripe'

export interface DonationMetadata extends Stripe.MetadataParam {
  type: DonationType | null
  campaignId: string | null
  personId: string | null
  isAnonymous: string | null
  wish: string | null
}
