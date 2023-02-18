import { DateTime } from 'aws-sdk/clients/devicefarm'

export enum BankTransactionStatus {
  UNPROCESSED = 'UNPROCESSED',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  UPDATED = 'UPDATED',
}

export type BankImportStatus = {
  status: BankTransactionStatus
  message?: string
  amount: number
  currency: string
  createdAt: DateTime
  extPaymentIntentId: string
}
