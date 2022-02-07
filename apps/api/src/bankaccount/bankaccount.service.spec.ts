import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '../prisma/prisma.service'
import { BankaccountService } from './bankaccount.service'

describe('BankaccountService', () => {
  let service: BankaccountService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BankaccountService, PrismaService],
    }).compile()

    service = module.get<BankaccountService>(BankaccountService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
