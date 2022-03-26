import { Injectable } from '@nestjs/common';
import { CreateRecurringDonationDto } from './dto/create-recurring-donation.dto';
import { UpdateRecurringDonationDto } from './dto/update-recurring-donation.dto';

@Injectable()
export class RecurringDonationService {
  create(createRecurringDonationDto: CreateRecurringDonationDto) {
    return 'This action adds a new recurringDonation';
  }

  findAll() {
    return `This action returns all recurringDonation`;
  }

  findOne(id: number) {
    return `This action returns a #${id} recurringDonation`;
  }

  update(id: number, updateRecurringDonationDto: UpdateRecurringDonationDto) {
    return `This action updates a #${id} recurringDonation`;
  }

  remove(id: number) {
    return `This action removes a #${id} recurringDonation`;
  }
}
