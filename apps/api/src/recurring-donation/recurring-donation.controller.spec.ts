import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '../prisma/prisma.service'
import { RecurringDonationController } from './recurring-donation.controller'
import { RecurringDonationService } from './recurring-donation.service'

describe('RecurringDonationController', () => {
  let controller: RecurringDonationController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecurringDonationController],
      providers: [RecurringDonationService, PrismaService],
    }).compile()

    controller = module.get<RecurringDonationController>(RecurringDonationController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
