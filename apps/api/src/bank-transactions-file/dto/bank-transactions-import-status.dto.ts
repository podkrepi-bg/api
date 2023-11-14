export enum ImportStatus {
  UNPROCESSED = 'UNPROCESSED',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  UPDATED = 'UPDATED',
  INCOMPLETE = 'INCOMPLETE',
}

export type BankImportResult = {
  status: ImportStatus
  message?: string
  amount: number
  currency: string
  createdAt: Date
  extPaymentIntentId: string
}
