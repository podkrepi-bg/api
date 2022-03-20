import { CampaignFileRole, CampaignFileType } from '@prisma/client'
import { Campaign } from '../../campaign/entities/campaign.entity'
import { Person } from '../../person/entities/person.entity'

export class CampaignFile {
  id: string
  filename: string
  role: CampaignFileRole
  type: CampaignFileType
  campaignId: string
  campaign?: Campaign
  uploadedById: string
  uploadedBy?: Person
}
