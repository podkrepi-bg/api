import { Campaign } from '../../campaign/entities/campaign.entity'
import { CampaignReportFile } from '../../campaignReportFile/entities/campaignReportFile.entity'
import { Person } from '../../person/entities/person.entity'

export class CampaignReport {
  id: string
  campaignId: string
  campaign?: Campaign
  startDate: Date
  endDate: Date
  description: string
  files?: CampaignReportFile[]
  totalFunds: number | null
  fundsForPeriod: number | null
  spentFundsForPeriod: number | null
  goals: string
  nextSteps: string
  additionalInfo: string
  creatorId: string
  createdBy?: Person
  isDeleted: boolean
}
