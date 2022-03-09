import { Campaign } from '../../campaign/entities/campaign.entity'
import { Person } from '../../person/entities/person.entity'

export class CampaignFile {
  id: string
  filename: string
  campaignId: string
  campaign?: Campaign
  uploadedById: string
  uploadedBy?: Person
}
