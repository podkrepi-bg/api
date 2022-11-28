export class CreateCampaignReportDto {
  startDate: Date
  endDate: Date
  description: string
  totalFunds?: number
  fundsForPeriod?: number
  spentFundsForPeriod?: number
  goals: string
  nextSteps: string
  additionalInfo: string
}
