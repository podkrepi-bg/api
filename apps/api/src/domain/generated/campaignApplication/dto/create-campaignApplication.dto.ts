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
  campaignTypeId?: string
  ticketURL?: string
  archived?: boolean
}
