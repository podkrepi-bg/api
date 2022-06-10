import { Test, TestingModule } from '@nestjs/testing'
import { BankTransactionsFileService } from './bank-transactions-file.service'

describe('BankTransactionsFileService', () => {
  let service: BankTransactionsFileService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BankTransactionsFileService],
    }).compile()

    service = module.get<BankTransactionsFileService>(BankTransactionsFileService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
