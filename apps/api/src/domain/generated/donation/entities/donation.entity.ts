
import {DonationType,DonationStatus,PaymentProvider,Currency} from '@prisma/client'
import {Person} from '../../person/entities/person.entity'
import {Vault} from '../../vault/entities/vault.entity'


export class Donation {
  id: string ;
type: DonationType ;
status: DonationStatus ;
provider: PaymentProvider ;
targetVaultId: string ;
extCustomerId: string ;
extPaymentIntentId: string ;
extPaymentMethodId: string ;
createdAt: Date ;
updatedAt: Date  | null;
amount: number ;
currency: Currency ;
personId: string  | null;
person?: Person  | null;
targetVault?: Vault ;
}
