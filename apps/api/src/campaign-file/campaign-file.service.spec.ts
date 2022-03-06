import { Test, TestingModule } from '@nestjs/testing'
import { CampaignFileService } from './campaign-file.service'

describe('CampaignFileService', () => {
  let service: CampaignFileService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CampaignFileService],
    }).compile()

    service = module.get<CampaignFileService>(CampaignFileService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
