import { PaymentType, Currency, PaymentStatus, PaymentProvider } from '@prisma/client'
import { Affiliate } from '../../affiliate/entities/affiliate.entity'
import { Donation } from '../../donation/entities/donation.entity'

export class Payment {
  id: string
  extCustomerId: string
  extPaymentIntentId: string
  extPaymentMethodId: string
  type: PaymentType
  currency: Currency
  status: PaymentStatus
  provider: PaymentProvider
  affiliateId: string | null
  createdAt: Date
  updatedAt: Date | null
  chargedAmount: number
  amount: number
  billingEmail: string | null
  billingName: string | null
  affiliate?: Affiliate | null
  donations?: Donation[]
}
