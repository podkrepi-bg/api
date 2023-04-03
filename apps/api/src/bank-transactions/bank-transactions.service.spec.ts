import { Test, TestingModule } from '@nestjs/testing'
import { ExportService } from '../export/export.service'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { BankTransactionsService } from './bank-transactions.service'

describe('BankTransactionsService', () => {
  let service: BankTransactionsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BankTransactionsService, MockPrismaService, ExportService],
    }).compile()

    service = module.get<BankTransactionsService>(BankTransactionsService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
