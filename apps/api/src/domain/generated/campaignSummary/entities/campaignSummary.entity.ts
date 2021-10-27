import { Campaign } from '../../campaign/entities/campaign.entity'

export class CampaignSummary {
  campaignId: string
  reachedAmount: number | null
  campaign?: Campaign
}
