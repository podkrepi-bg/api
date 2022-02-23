
import {DonationType,DonationStatus,PaymentProvider,Currency} from '@prisma/client'
import {Vault} from '../../vault/entities/vault.entity'
import {Person} from '../../person/entities/person.entity'


export class Donation {
  id: string ;
type: DonationType ;
status: DonationStatus ;
provider: PaymentProvider ;
personId: string  | null;
currency: Currency ;
amount: number ;
targetVaultId: string ;
extCustomerId: string ;
extPaymentIntentId: string ;
extPaymentMethodId: string ;
createdAt: Date ;
updatedAt: Date  | null;
targetVault?: Vault ;
person?: Person  | null;
}
