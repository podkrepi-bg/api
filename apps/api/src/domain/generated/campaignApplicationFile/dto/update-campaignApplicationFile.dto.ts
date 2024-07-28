import { CampaignApplicationFileRole } from '@prisma/client'
import { ApiProperty } from '@nestjs/swagger'

export class UpdateCampaignApplicationFileDto {
  filename?: string
  personId?: string
  mimetype?: string
  @ApiProperty({ enum: CampaignApplicationFileRole })
  role?: CampaignApplicationFileRole
}
