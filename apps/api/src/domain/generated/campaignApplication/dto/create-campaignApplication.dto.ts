import { CampaignTypeCategory } from '@prisma/client'
import { ApiProperty } from '@nestjs/swagger'

export class CreateCampaignApplicationDto {
  organizerName: string
  organizerEmail?: string
  organizerPhone?: string
  beneficiary: string
  organizerBeneficiaryRel: string
  campaignName: string
  goal: string
  history?: string
  amount: string
  description?: string
  campaignGuarantee?: string
  otherFinanceSources?: string
  otherNotes?: string
  @ApiProperty({ enum: CampaignTypeCategory })
  category?: CampaignTypeCategory
  ticketURL?: string
  archived?: boolean
}
