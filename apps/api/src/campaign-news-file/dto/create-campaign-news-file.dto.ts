import { CampaignFileRole } from '@prisma/client'

export class CreateCampaignNewsFileDto {
  filename: string
  mimetype: string
  articleId: string
  personId: string
  role: CampaignFileRole
}
