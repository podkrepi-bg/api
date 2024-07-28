import { CampaignApplicationState, CampaignTypeCategory } from '@prisma/client'
import { Organizer } from '../../organizer/entities/organizer.entity'
import { CampaignApplicationFile } from '../../campaignApplicationFile/entities/campaignApplicationFile.entity'

export class CampaignApplication {
  id: string
  createdAt: Date
  updatedAt: Date | null
  organizerId: string | null
  organizer?: Organizer | null
  organizerName: string
  organizerEmail: string | null
  organizerPhone: string | null
  beneficiary: string
  organizerBeneficiaryRel: string
  campaignName: string
  goal: string
  history: string | null
  amount: string
  description: string | null
  documents?: CampaignApplicationFile[]
  campaignGuarantee: string | null
  otherFinanceSources: string | null
  otherNotes: string | null
  state: CampaignApplicationState
  category: CampaignTypeCategory | null
  ticketURL: string | null
  archived: boolean | null
}
