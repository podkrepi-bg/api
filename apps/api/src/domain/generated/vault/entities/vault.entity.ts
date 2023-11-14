
import {Currency} from '@prisma/client'
import {Campaign} from '../../campaign/entities/campaign.entity'
import {Donation} from '../../donation/entities/donation.entity'
import {Expense} from '../../expense/entities/expense.entity'
import {RecurringDonation} from '../../recurringDonation/entities/recurringDonation.entity'
import {Transfer} from '../../transfer/entities/transfer.entity'
import {Withdrawal} from '../../withdrawal/entities/withdrawal.entity'


export class Vault {
  id: string ;
currency: Currency ;
amount: number ;
campaignId: string ;
createdAt: Date ;
updatedAt: Date  | null;
name: string ;
blockedAmount: number ;
campaign?: Campaign ;
donations?: Donation[] ;
expenses?: Expense[] ;
recurringDonations?: RecurringDonation[] ;
sourceTransfers?: Transfer[] ;
targetTransfers?: Transfer[] ;
withdraws?: Withdrawal[] ;
}
