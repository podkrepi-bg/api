import { Test, TestingModule } from '@nestjs/testing'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { RecurringDonationService } from './recurring-donation.service'

describe('RecurringDonationService', () => {
  let service: RecurringDonationService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecurringDonationService, MockPrismaService],
    }).compile()

    service = module.get<RecurringDonationService>(RecurringDonationService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
