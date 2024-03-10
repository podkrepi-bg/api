import { DonationType } from '@prisma/client'
import { Person } from '../../person/entities/person.entity'
import { Vault } from '../../vault/entities/vault.entity'
import { DonationWish } from '../../donationWish/entities/donationWish.entity'
import { DonationMetadata } from '../../donationMetadata/entities/donationMetadata.entity'
import { Payment } from '../../payment/entities/payment.entity'

export class Donation {
  id: string
  paymentId: string
  type: DonationType
  targetVaultId: string
  amount: number
  personId: string | null
  createdAt: Date
  updatedAt: Date | null
  person?: Person | null
  targetVault?: Vault
  DonationWish?: DonationWish | null
  metadata?: DonationMetadata | null
  payment?: Payment
}
