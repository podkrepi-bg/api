import { Test, TestingModule } from '@nestjs/testing'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { BankAccountService } from './bankaccount.service'

describe('BankaccountService', () => {
  let service: BankAccountService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BankAccountService, MockPrismaService],
    }).compile()

    service = module.get<BankAccountService>(BankAccountService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
