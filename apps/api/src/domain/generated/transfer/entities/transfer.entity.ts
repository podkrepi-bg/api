
import {TransferStatus,Currency} from '@prisma/client'
import {Person} from '../../person/entities/person.entity'
import {Vault} from '../../vault/entities/vault.entity'
import {Campaign} from '../../campaign/entities/campaign.entity'


export class Transfer {
  id: string ;
status: TransferStatus ;
currency: Currency ;
amount: number ;
reason: string ;
sourceVaultId: string ;
sourceCampaignId: string ;
targetVaultId: string ;
targetCampaignId: string ;
approvedById: string  | null;
documentId: string  | null;
targetDate: Date  | null;
createdAt: Date ;
updatedAt: Date  | null;
approvedBy?: Person  | null;
sourceVault?: Vault ;
sourceCampaign?: Campaign ;
targetVault?: Vault ;
targetCampaign?: Campaign ;
}
