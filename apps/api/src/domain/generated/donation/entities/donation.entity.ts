
import {DonationType,DonationStatus,PaymentProvider,Currency} from '@prisma/client'
import {Person} from '../../person/entities/person.entity'
import {Vault} from '../../vault/entities/vault.entity'
import {Affiliate} from '../../affiliate/entities/affiliate.entity'
import {DonationWish} from '../../donationWish/entities/donationWish.entity'


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
affiliateId: string  | null;
personId: string  | null;
billingEmail: string  | null;
billingName: string  | null;
chargedAmount: number ;
person?: Person  | null;
targetVault?: Vault ;
affiliate?: Affiliate  | null;
DonationWish?: DonationWish  | null;
}
