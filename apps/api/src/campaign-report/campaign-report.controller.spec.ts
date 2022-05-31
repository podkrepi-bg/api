import { Test, TestingModule } from '@nestjs/testing'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { ReportFileService } from '../report-file/report-file.service'
import { S3Service } from '../s3/s3.service'
import { CampaignReportController } from './campaign-report.controller'
import { CampaignReportService } from './campaign-report.service'

describe('CampaignReportController', () => {
  let controller: CampaignReportController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CampaignReportController],
      providers: [CampaignReportService, MockPrismaService, ReportFileService, S3Service],
    }).compile()

    controller = module.get<CampaignReportController>(CampaignReportController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
