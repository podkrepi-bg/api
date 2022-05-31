import { Test, TestingModule } from '@nestjs/testing'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { ReportFileService } from '../report-file/report-file.service'
import { S3Service } from '../s3/s3.service'
import { CampaignReportService } from './campaign-report.service'

describe('CampaignReportService', () => {
  let service: CampaignReportService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CampaignReportService, MockPrismaService, ReportFileService, S3Service],
    }).compile()

    service = module.get<CampaignReportService>(CampaignReportService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
