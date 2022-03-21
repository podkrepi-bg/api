import { CampaignFileRole } from '@prisma/client'

export class CreateCampaignFileDto {
  filename: string
  mimetype: string
  campaignId: string
  uploadedById: string
  role: CampaignFileRole
}
