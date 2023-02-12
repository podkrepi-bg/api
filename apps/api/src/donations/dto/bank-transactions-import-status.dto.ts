import { DateTime } from 'aws-sdk/clients/devicefarm'

export enum TransactionStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  UPDATED = 'updated',
}

export type BankImportStatus = {
  status: TransactionStatus
  message?: string
  amount: number
  currency: string
  createdAt: DateTime
  extPaymentIntentId: string
}
