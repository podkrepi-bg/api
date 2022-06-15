import { BankTransactionsFileType } from '@prisma/client'
import { ApiProperty } from '@nestjs/swagger'

export class UpdateBankTransactionsFileDto {
  filename?: string
  mimetype?: string
  bankTransactionsFileId?: string
  personId?: string
  @ApiProperty({ enum: BankTransactionsFileType })
  type?: BankTransactionsFileType
}
