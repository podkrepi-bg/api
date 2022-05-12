import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { CampaignReportService } from '../campaign-report/campaign-report.service'
import { PersonService } from '../person/person.service'

import { MockPrismaService } from '../prisma/prisma-client.mock'
import { S3Service } from '../s3/s3.service'
import { ReportFileController } from './report-file.controller'
import { ReportFileService } from './report-file.service'

describe('ReportFileController', () => {
  let controller: ReportFileController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportFileController],
      providers: [
        ConfigService,
        ReportFileService,
        CampaignReportService,
        MockPrismaService,
        S3Service,
        PersonService,
      ],
    }).compile()

    controller = module.get<ReportFileController>(ReportFileController)
  })
  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
