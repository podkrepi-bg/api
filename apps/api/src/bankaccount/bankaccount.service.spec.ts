import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '../prisma/prisma.service'
import { BankAccountService } from './bankaccount.service'

describe('BankaccountService', () => {
  let service: BankAccountService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BankAccountService, PrismaService],
    }).compile()

    service = module.get<BankAccountService>(BankAccountService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
