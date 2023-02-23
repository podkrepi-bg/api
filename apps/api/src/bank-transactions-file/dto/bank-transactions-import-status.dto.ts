export enum ImportStatus {
  UNPROCESSED = 'UNPROCESSED',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  UPDATED = 'UPDATED',
}

export type BankImportResult = {
  status: ImportStatus
  message?: string
  amount: number
  currency: string
  createdAt: Date
  extPaymentIntentId: string
}
