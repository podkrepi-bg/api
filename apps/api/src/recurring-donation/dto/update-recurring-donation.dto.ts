import { PartialType } from '@nestjs/swagger'
import { CreateRecurringDonationDto } from './create-recurring-donation.dto'

export class UpdateRecurringDonationDto extends PartialType(CreateRecurringDonationDto) {}
