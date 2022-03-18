import { CampaignFileRole } from '@prisma/client'
import { ApiProperty } from '@nestjs/swagger'

export class UpdateCampaignFileDto {
  filename?: string
  @ApiProperty({ enum: CampaignFileRole })
  role?: CampaignFileRole
  type?: string
}
