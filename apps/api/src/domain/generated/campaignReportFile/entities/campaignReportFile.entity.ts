import { CampaignReportFileType } from '@prisma/client'
import { CampaignReport } from '../../campaignReport/entities/campaignReport.entity'
import { Person } from '../../person/entities/person.entity'

export class CampaignReportFile {
  id: string
  reportId: string
  report?: CampaignReport
  filename: string
  mimetype: string
  type: CampaignReportFileType
  creatorId: string
  createdBy?: Person
  isDeleted: boolean
}
