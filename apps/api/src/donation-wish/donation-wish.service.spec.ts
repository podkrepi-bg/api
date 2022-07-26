import { Test, TestingModule } from '@nestjs/testing'
import { DonationWishService } from './donation-wish.service'
import { MockPrismaService } from '../prisma/prisma-client.mock'

describe('DonationWishService', () => {
  let service: DonationWishService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DonationWishService, MockPrismaService],
    }).compile()

    service = module.get<DonationWishService>(DonationWishService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
