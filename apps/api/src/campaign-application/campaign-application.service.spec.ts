import { Test, TestingModule } from '@nestjs/testing'
import { CampaignApplicationService } from './campaign-application.service'

describe('CampaignApplicationService', () => {
  let service: CampaignApplicationService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CampaignApplicationService],
    }).compile()

    service = module.get<CampaignApplicationService>(CampaignApplicationService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
