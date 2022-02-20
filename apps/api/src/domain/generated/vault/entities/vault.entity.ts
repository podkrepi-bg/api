
import {Currency} from '@prisma/client'
import {Campaign} from '../../campaign/entities/campaign.entity'
import {Expense} from '../../expense/entities/expense.entity'
import {Transfer} from '../../transfer/entities/transfer.entity'
import {Donation} from '../../donation/entities/donation.entity'
import {Withdrawal} from '../../withdrawal/entities/withdrawal.entity'
import {RecurringDonation} from '../../recurringDonation/entities/recurringDonation.entity'


export class Vault {
  id: string ;
currency: Currency ;
amount: number ;
campaignId: string  | null;
createdAt: Date ;
updatedAt: Date  | null;
campaign?: Campaign  | null;
expenses?: Expense[] ;
sourceTransfers?: Transfer[] ;
targetTransfers?: Transfer[] ;
donations?: Donation[] ;
withdraws?: Withdrawal[] ;
recurringDonations?: RecurringDonation[] ;
}
