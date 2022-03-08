
import {RecurringDonationStatus} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'




export class CreateRecurringDonationDto {
  @ApiProperty({ enum: RecurringDonationStatus})
status: RecurringDonationStatus;
extSubscriptionId: string;
extCustomerId?: string;
}
