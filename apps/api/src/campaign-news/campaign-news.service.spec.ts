import { Test, TestingModule } from '@nestjs/testing'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { CampaignNewsService } from './campaign-news.service'

describe('CampaignNewsService', () => {
  let service: CampaignNewsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CampaignNewsService, MockPrismaService],
    }).compile()

    service = module.get<CampaignNewsService>(CampaignNewsService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
