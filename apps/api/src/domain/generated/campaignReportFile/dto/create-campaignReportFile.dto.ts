import { CampaignReportFileType } from '@prisma/client'
import { ApiProperty } from '@nestjs/swagger'

export class CreateCampaignReportFileDto {
  filename: string
  mimetype: string
  @ApiProperty({ enum: CampaignReportFileType })
  type: CampaignReportFileType
}
