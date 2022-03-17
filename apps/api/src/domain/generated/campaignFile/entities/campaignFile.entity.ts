import { Campaign } from '../../campaign/entities/campaign.entity'
import { Person } from '../../person/entities/person.entity'

export class CampaignFile {
  id: string
  filename: string
  role: string
  type: string
  campaignId: string
  campaign?: Campaign
  uploadedById: string
  uploadedBy?: Person
}
