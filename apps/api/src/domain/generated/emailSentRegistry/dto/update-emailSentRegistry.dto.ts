
import {EmailType} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'




export class UpdateEmailSentRegistryDto {
  email?: string;
dateSent?: Date;
campaignId?: string;
@ApiProperty({ enum: EmailType})
type?: EmailType;
}
