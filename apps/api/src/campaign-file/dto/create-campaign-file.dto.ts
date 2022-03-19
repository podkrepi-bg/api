import { CampaignFileRole } from '@prisma/client'

export class CreateCampaignFileDto {
  filename: string
  campaignId: string
  uploadedById: string
  role: CampaignFileRole
  type: string
}
