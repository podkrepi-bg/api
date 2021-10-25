import { Campaign } from '../../campaign/entities/campaign.entity'

export class CampaignSummary {
  id: string
  campaign?: Campaign
  reachedAmount: number | null
}
