import { Test, TestingModule } from '@nestjs/testing'

import { CampaignService } from './campaign.service'
import { MockPrismaService } from '../prisma/prisma-client.mock'

describe('CampaignService', () => {
  let service: CampaignService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CampaignService, MockPrismaService],
    }).compile()

    service = module.get<CampaignService>(CampaignService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
