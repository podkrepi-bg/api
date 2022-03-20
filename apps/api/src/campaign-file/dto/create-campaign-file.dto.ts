import { CampaignFileRole, CampaignFileType } from '@prisma/client'

export class CreateCampaignFileDto {
  filename: string
  campaignId: string
  uploadedById: string
  role: CampaignFileRole
  type: CampaignFileType
}
