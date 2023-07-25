import { Test, TestingModule } from '@nestjs/testing'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { WithdrawalService } from './withdrawal.service'
import { MarketingNotificationsModule } from '../notifications/notifications.module'

describe('WithdrawalService', () => {
  let service: WithdrawalService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WithdrawalService, MockPrismaService, MarketingNotificationsModule],
    }).compile()

    service = module.get<WithdrawalService>(WithdrawalService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
