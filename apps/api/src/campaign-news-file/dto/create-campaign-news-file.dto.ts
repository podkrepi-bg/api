import { CampaignFileRole } from '@prisma/client'

export class CreateCampaignNewsFileDto {
  filename: string
  mimetype: string
  newsId: string
  personId: string
  role: CampaignFileRole
}
