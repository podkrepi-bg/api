import { CampaignApplicationFileRole } from '@prisma/client'
import { CampaignApplication } from '../../campaignApplication/entities/campaignApplication.entity'

export class CampaignApplicationFile {
  id: string
  filename: string
  campaignApplicationId: string
  personId: string
  mimetype: string
  role: CampaignApplicationFileRole
  campaignApplication?: CampaignApplication
}
