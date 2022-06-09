import { Test, TestingModule } from '@nestjs/testing';
import { BankTransactionsFileController } from './bank-transactions-file.controller';
import { BankTransactionsFileService } from './bank-transactions-file.service';

describe('BankTransactionsFileController', () => {
  let controller: BankTransactionsFileController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BankTransactionsFileController],
      providers: [BankTransactionsFileService],
    }).compile();

    controller = module.get<BankTransactionsFileController>(BankTransactionsFileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
