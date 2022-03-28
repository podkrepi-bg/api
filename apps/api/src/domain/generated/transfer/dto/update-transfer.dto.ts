
import {Currency} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'




export class UpdateTransferDto {
  @ApiProperty({ enum: Currency})
currency?: Currency;
reason?: string;
documentId?: string;
targetDate?: Date;
}
