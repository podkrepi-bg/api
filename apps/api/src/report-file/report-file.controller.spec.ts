import { Test, TestingModule } from '@nestjs/testing'
import { ReportFileController } from './report-file.controller'
import { ReportFileService } from './report-file.service'

describe('ReportFileController', () => {
  let controller: ReportFileController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportFileController],
      providers: [ReportFileService],
    }).compile()

    controller = module.get<ReportFileController>(ReportFileController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
