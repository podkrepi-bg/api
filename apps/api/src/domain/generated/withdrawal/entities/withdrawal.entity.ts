
import {WithdrawStatus,Currency} from '@prisma/client'
import {Person} from '../../person/entities/person.entity'
import {BankAccount} from '../../bankAccount/entities/bankAccount.entity'
import {Campaign} from '../../campaign/entities/campaign.entity'
import {Vault} from '../../vault/entities/vault.entity'


export class Withdrawal {
  id: string ;
status: WithdrawStatus ;
currency: Currency ;
amount: number ;
reason: string ;
sourceVaultId: string ;
sourceCampaignId: string ;
bankAccountId: string ;
documentId: string  | null;
approvedById: string  | null;
targetDate: Date  | null;
createdAt: Date ;
updatedAt: Date  | null;
approvedBy?: Person  | null;
bankAccount?: BankAccount ;
sourceCampaign?: Campaign ;
sourceVault?: Vault ;
}
