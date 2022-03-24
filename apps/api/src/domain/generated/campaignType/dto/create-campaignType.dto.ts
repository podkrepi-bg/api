import { CampaignTypeCategory } from '@prisma/client'
import { ApiProperty } from '@nestjs/swagger'

export class CreateCampaignTypeDto {
  @ApiProperty({ enum: CampaignTypeCategory })
  category: CampaignTypeCategory
  name: string
  slug: string
  description?: string
}
