import { CampaignReport } from '../../campaignReport/entities/campaignReport.entity'
import { Person } from '../../person/entities/person.entity'
import { Campaign } from '../../campaign/entities/campaign.entity'

export class ReportFile {
  id: string
  filename: string
  mimetype: string
  campaignReportId: string
  uploadedById: string
  campaignId: string
  CampaignReport?: CampaignReport
  uploadedBy?: Person
  Campaign?: Campaign
}
