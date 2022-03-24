import { CampaignTypeCategory } from '@prisma/client'
import { ApiProperty } from '@nestjs/swagger'

export class UpdateCampaignTypeDto {
  @ApiProperty({ enum: CampaignTypeCategory })
  category?: CampaignTypeCategory
  name?: string
  slug?: string
  description?: string
}
