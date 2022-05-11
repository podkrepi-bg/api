import { Test, TestingModule } from '@nestjs/testing'
import { ReportFileService } from './report-file.service'

describe('ReportFileService', () => {
  let service: ReportFileService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportFileService],
    }).compile()

    service = module.get<ReportFileService>(ReportFileService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
