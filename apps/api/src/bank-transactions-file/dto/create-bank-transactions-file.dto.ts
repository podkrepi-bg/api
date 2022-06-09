import { BankTransactionsFileRole } from "@prisma/client"

export class CreateBankTransactionsFileDto {
  filename: string
  mimetype: string
  bankTransactionsFileId: string
  role: BankTransactionsFileRole
}
