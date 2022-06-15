import { BankTransactionsFileType } from '@prisma/client'

export class BankTransactionsFile {
  id: string
  filename: string
  mimetype: string
  bankTransactionsFileId: string
  personId: string
  type: BankTransactionsFileType
}
