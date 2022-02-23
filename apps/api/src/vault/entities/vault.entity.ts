import { Campaign, Currency, Donation, Expense, RecurringDonation, Transfer, Withdrawal } from '@prisma/client'

export class Vault {
  id: string
  name: string
  currency: Currency
  amount: number
  campaignId: string
  createdAt: Date
  updatedAt: Date | null
  campaign?: Campaign
  expenses?: Expense[]
  sourceTransfers?: Transfer[]
  targetTransfers?: Transfer[]
  donations?: Donation[]
  withdraws?: Withdrawal[]
  recurringDonations?: RecurringDonation[]
}
