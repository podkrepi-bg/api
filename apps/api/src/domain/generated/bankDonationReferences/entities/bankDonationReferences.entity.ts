import { Campaign } from '../../campaign/entities/campaign.entity'

export class BankDonationReferences {
  id: string
  amount: number
  campaignId: string
  billingName: string
  billingEmail: string
  campaign?: Campaign
}
