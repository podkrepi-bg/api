import { CampaignReport } from '../../campaignReport/entities/campaignReport.entity'
import { Person } from '../../person/entities/person.entity'

export class ReportFile {
  id: string
  filename: string
  mimetype: string
  campaignReportId: string
  uploadedById: string
  campaignReport?: CampaignReport
  uploadedBy?: Person
}
