import { Test, TestingModule } from '@nestjs/testing';
import { BankTransactionsService } from './bank-transactions.service';

describe('BankTransactionsService', () => {
  let service: BankTransactionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BankTransactionsService],
    }).compile();

    service = module.get<BankTransactionsService>(BankTransactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
