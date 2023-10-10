
import {RecurringDonationStatus} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'




export class UpdateRecurringDonationDto {
  @ApiProperty({ enum: RecurringDonationStatus})
status?: RecurringDonationStatus;
extSubscriptionId?: string;
extCustomerId?: string;
}
