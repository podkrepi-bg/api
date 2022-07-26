import { Test, TestingModule } from '@nestjs/testing'
import { DonationWishController } from './donation-wish.controller'
import { DonationWishService } from './donation-wish.service'
import { MockPrismaService } from '../prisma/prisma-client.mock'

describe('DonationWishController', () => {
  let controller: DonationWishController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DonationWishController],
      providers: [DonationWishService, MockPrismaService],
    }).compile()

    controller = module.get<DonationWishController>(DonationWishController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
