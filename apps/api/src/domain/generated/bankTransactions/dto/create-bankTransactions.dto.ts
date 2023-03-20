import { BankTransactionType } from '@prisma/client'
import { ApiProperty } from '@nestjs/swagger'

export class CreateBankTransactionsDto {
  ibanNumber: string
  bankName?: string
  bankIdCode?: string
  senderName?: string
  recipientName?: string
  @ApiProperty({ enum: BankTransactionType })
  type: BankTransactionType
}
