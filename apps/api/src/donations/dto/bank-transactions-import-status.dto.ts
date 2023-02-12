import { DateTime } from 'aws-sdk/clients/devicefarm'

export enum TransactionStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  UPDATED = 'UPDATED',
}

export type BankImportStatus = {
  status: TransactionStatus
  message?: string
  amount: number
  currency: string
  createdAt: DateTime
  extPaymentIntentId: string
}
