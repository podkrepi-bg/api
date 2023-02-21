import { DateTime } from 'aws-sdk/clients/devicefarm'

export enum ImportStatus {
  UNPROCESSED = 'UNPROCESSED',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  UPDATED = 'UPDATED',
}

export type BankImport = {
  status?: ImportStatus
  message?: string
  amount: number
  currency: string
  createdAt: DateTime
  extPaymentIntentId: string
}
