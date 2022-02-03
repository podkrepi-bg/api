import { Test, TestingModule } from '@nestjs/testing';
import { BankaccountController } from './bankaccount.controller';
import { BankaccountService } from './bankaccount.service';

describe('BankaccountController', () => {
  let controller: BankaccountController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BankaccountController],
      providers: [BankaccountService],
    }).compile();

    controller = module.get<BankaccountController>(BankaccountController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
