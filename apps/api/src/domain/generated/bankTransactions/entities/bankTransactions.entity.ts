import { BankTransactionType, Currency } from '@prisma/client'

export class BankTransactions {
  id: string
  ibanNumber: string
  bankName: string | null
  bankIdCode: string | null
  transactionDate: Date | null
  senderName: string | null
  recipientName: string | null
  type: BankTransactionType
  amount: number
  currency: Currency
}
