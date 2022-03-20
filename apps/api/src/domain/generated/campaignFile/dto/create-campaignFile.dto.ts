import { CampaignFileRole, CampaignFileType } from '@prisma/client'
import { ApiProperty } from '@nestjs/swagger'

export class CreateCampaignFileDto {
  filename: string
  @ApiProperty({ enum: CampaignFileRole })
  role: CampaignFileRole
  @ApiProperty({ enum: CampaignFileType })
  type: CampaignFileType
}
