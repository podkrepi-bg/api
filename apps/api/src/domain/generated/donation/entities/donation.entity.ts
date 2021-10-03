import { DonationType, DonationStatus, PaymentProvider } from '@prisma/client'
import { Vault } from '../../vault/entities/vault.entity'

export class Donation {
  id: string
  type: DonationType
  status: DonationStatus
  provider: PaymentProvider
  targetVaultId: string
  extCustomerId: string
  extPaymentIntentId: string
  extPaymentMethodId: string
  createdAt: Date
  updatedAt: Date | null
  targetVault?: Vault
}
