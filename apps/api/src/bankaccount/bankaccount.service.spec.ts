import { Test, TestingModule } from '@nestjs/testing';
import { BankaccountService } from './bankaccount.service';

describe('BankaccountService', () => {
  let service: BankaccountService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BankaccountService],
    }).compile();

    service = module.get<BankaccountService>(BankaccountService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
