import { CampaignApplicationFileRole } from '@prisma/client'

export class CreateCampaignApplicationFileDto {
  filename: string
  mimetype: string
  campaignApplicationId: string
  personId: string
  role: CampaignApplicationFileRole
}
