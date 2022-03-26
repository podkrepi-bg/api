import { Test, TestingModule } from '@nestjs/testing';
import { RecurringDonationService } from './recurring-donation.service';

describe('RecurringDonationService', () => {
  let service: RecurringDonationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecurringDonationService],
    }).compile();

    service = module.get<RecurringDonationService>(RecurringDonationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
