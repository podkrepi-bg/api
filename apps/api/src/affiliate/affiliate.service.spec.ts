import { Test, TestingModule } from '@nestjs/testing'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { AffiliateService } from './affiliate.service'

describe('AffiliateService', () => {
  let service: AffiliateService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AffiliateService, MockPrismaService],
    }).compile()

    service = module.get<AffiliateService>(AffiliateService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
