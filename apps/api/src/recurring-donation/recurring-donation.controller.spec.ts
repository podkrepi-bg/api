import { Test, TestingModule } from '@nestjs/testing'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { RecurringDonationController } from './recurring-donation.controller'
import { RecurringDonationService } from './recurring-donation.service'

describe('RecurringDonationController', () => {
  let controller: RecurringDonationController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecurringDonationController],
      providers: [RecurringDonationService, MockPrismaService],
    }).compile()

    controller = module.get<RecurringDonationController>(RecurringDonationController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
