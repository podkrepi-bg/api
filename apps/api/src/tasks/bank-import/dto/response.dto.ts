/* Info on payload and response structure:
https://en.irisbgsf.com/api-documentation
 */

import { Currency } from '@prisma/client'

type IrisBankInfo = {
  bankHash: string
  name: string
  directPayment: boolean
  paymentRequiresIban: boolean
  fullName: string
  bic: string
  services: string
  country: string
  consentRequiresIban: boolean
  consentRequiresPsu: boolean
  paymentRequiresAuthorization: boolean
  consentRequiresAuthorization: boolean
  paymentRequiresPsu: boolean
}

export type GetIrisBanksResponse = IrisBankInfo[]

export type IrisIbanAccountInfo = {
  id: number
  name: string
  iban: string
  currency: 'BGN' | `EUR` | `USD` | string
  hasAuthorization: boolean
  bankHash: string
  bankName: string
  country: string
  dateCreate: number
  consents: {
    consents: [
      {
        status: 'valid' | string
      },
    ]
    errorCodes: any
  }
}

export type GetIrisUserIbanAccountsResponse = IrisIbanAccountInfo[]

export type IrisTransactionInfo = {
  transactionId: string
  bookingDate: string
  debtorAccount: {
    iban: string
  } | null
  creditorAccount: {
    iban: string
  } | null
  creditorName: string | null
  debtorName: string | null
  // Payment comment
  remittanceInformationUnstructured: string
  transactionAmount: {
    amount: number
    currency: Currency
  }
  exchangeRate: number | null
  valueDate: string
  creditDebitIndicator: 'DEBIT' | 'CREDIT'
}

export type GetIrisTransactionInfoResponse = { transactions: IrisTransactionInfo[] }
