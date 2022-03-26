import { Module } from '@nestjs/common';
import { RecurringDonationService } from './recurring-donation.service';
import { RecurringDonationController } from './recurring-donation.controller';

@Module({
  controllers: [RecurringDonationController],
  providers: [RecurringDonationService]
})
export class RecurringDonationModule {}
