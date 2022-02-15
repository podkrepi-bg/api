
import {CampaignState,Currency} from '@prisma/client'
import {Person} from '../../person/entities/person.entity'
import {Coordinator} from '../../coordinator/entities/coordinator.entity'
import {CampaignType} from '../../campaignType/entities/campaignType.entity'
import {Vault} from '../../vault/entities/vault.entity'
import {Transfer} from '../../transfer/entities/transfer.entity'
import {Withdrawal} from '../../withdrawal/entities/withdrawal.entity'


export class Campaign {
  id: string ;
state: CampaignState ;
slug: string ;
title: string ;
essence: string ;
coordinatorId: string ;
beneficiaryId: string ;
campaignTypeId: string ;
approvedById: string  | null;
description: string  | null;
targetAmount: number  | null;
currency: Currency ;
startDate: Date  | null;
endDate: Date  | null;
createdAt: Date ;
updatedAt: Date  | null;
deletedAt: Date  | null;
approvedBy?: Person  | null;
coordinator?: Coordinator ;
campaignType?: CampaignType ;
vaults?: Vault[] ;
incomingTransfers?: Transfer[] ;
outgoingTransfers?: Transfer[] ;
withdrawals?: Withdrawal[] ;
}
