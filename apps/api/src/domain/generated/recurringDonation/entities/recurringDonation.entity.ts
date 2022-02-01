
import {RecurringDonationStatus,Currency} from '@prisma/client'
import {Person} from '../../person/entities/person.entity'
import {Vault} from '../../vault/entities/vault.entity'


export class RecurringDonation {
  id: string ;
status: RecurringDonationStatus ;
vaultId: string ;
personId: string ;
extSubscriptionId: string ;
extCustomerId: string  | null;
createdAt: Date ;
updatedAt: Date  | null;
amount: number ;
currency: Currency ;
person?: Person ;
sourceVault?: Vault ;
}
