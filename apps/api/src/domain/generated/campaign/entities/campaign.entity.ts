
import {CampaignState,Currency} from '@prisma/client'
import {Person} from '../../person/entities/person.entity'
import {Beneficiary} from '../../beneficiary/entities/beneficiary.entity'
import {CampaignType} from '../../campaignType/entities/campaignType.entity'
import {Coordinator} from '../../coordinator/entities/coordinator.entity'
import {Organizer} from '../../organizer/entities/organizer.entity'
import {Company} from '../../company/entities/company.entity'
import {CampaignFile} from '../../campaignFile/entities/campaignFile.entity'
import {DonationWish} from '../../donationWish/entities/donationWish.entity'
import {Irregularity} from '../../irregularity/entities/irregularity.entity'
import {Transfer} from '../../transfer/entities/transfer.entity'
import {Vault} from '../../vault/entities/vault.entity'
import {Withdrawal} from '../../withdrawal/entities/withdrawal.entity'
import {SlugArchive} from '../../slugArchive/entities/slugArchive.entity'
import {CampaignNews} from '../../campaignNews/entities/campaignNews.entity'
import {NotificationList} from '../../notificationList/entities/notificationList.entity'


export class Campaign {
  id: string ;
state: CampaignState ;
slug: string ;
title: string ;
essence: string ;
coordinatorId: string ;
beneficiaryId: string ;
campaignTypeId: string ;
description: string  | null;
targetAmount: number  | null;
startDate: Date  | null;
endDate: Date  | null;
createdAt: Date ;
updatedAt: Date  | null;
deletedAt: Date  | null;
approvedById: string  | null;
currency: Currency ;
allowDonationOnComplete: boolean ;
paymentReference: string ;
organizerId: string  | null;
companyId: string  | null;
approvedBy?: Person  | null;
beneficiary?: Beneficiary ;
campaignType?: CampaignType ;
coordinator?: Coordinator ;
organizer?: Organizer  | null;
company?: Company  | null;
campaignFiles?: CampaignFile[] ;
donationWish?: DonationWish[] ;
irregularities?: Irregularity[] ;
outgoingTransfers?: Transfer[] ;
incomingTransfers?: Transfer[] ;
vaults?: Vault[] ;
withdrawals?: Withdrawal[] ;
slugArchive?: SlugArchive[] ;
campaignNews?: CampaignNews[] ;
notificationLists?: NotificationList[] ;
}
