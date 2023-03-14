import Stripe from 'stripe'

export interface DonationMetadata extends Stripe.MetadataParam {
  campaignId: string | null
  personId: string | null
  isAnonymous: string | null
  wish: string | null
}
