import { Campaign } from '../../campaign/entities/campaign.entity'

export class CampaignFile {
  id: string
  filename: string
  campaignId: string
  campaign?: Campaign
}
