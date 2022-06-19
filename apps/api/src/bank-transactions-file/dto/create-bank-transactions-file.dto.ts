import { BankTransactionsFileType } from '@prisma/client'

export class CreateBankTransactionsFileDto {
  filename: string
  mimetype: string
  bankTransactionsFileId: string
  type: BankTransactionsFileType
  personId: string
}
