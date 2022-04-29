import { ReportStatus, ReportReason } from '@prisma/client'
import { Campaign } from '../../campaign/entities/campaign.entity'
import { Person } from '../../person/entities/person.entity'

export class CampaignReport {
  id: string
  campaignId: string
  reportedById: string
  createdAt: Date
  updatedAt: Date | null
  status: ReportStatus
  reason: ReportReason
  reportContent: string
  campaign?: Campaign
  reportedBy?: Person
}
