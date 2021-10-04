import { RecurringDonationStatus } from '@prisma/client'
import { Vault } from '../../vault/entities/vault.entity'
import { Person } from '../../person/entities/person.entity'

export class RecurringDonation {
  id: string
  status: RecurringDonationStatus
  vaultId: string
  personId: string
  extSubscriptionId: string
  extCustomerId: string | null
  createdAt: Date
  updatedAt: Date | null
  sourceVault?: Vault
  person?: Person
}
