
import {AccountHolderType} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'




export class UpdateBankAccountDto {
  ibanNumber?: string;
accountHolderName?: string;
@ApiProperty({ enum: AccountHolderType})
accountHolderType?: AccountHolderType;
bankName?: string;
bankIdCode?: string;
fingerprint?: string;
}
