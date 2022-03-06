
import {Donation} from '../../donation/entities/donation.entity'
import {Expense} from '../../expense/entities/expense.entity'
import {Document} from '../../document/entities/document.entity'
import {Transfer} from '../../transfer/entities/transfer.entity'
import {Campaign} from '../../campaign/entities/campaign.entity'
import {Supporter} from '../../supporter/entities/supporter.entity'
import {Benefactor} from '../../benefactor/entities/benefactor.entity'
import {Withdrawal} from '../../withdrawal/entities/withdrawal.entity'
import {Beneficiary} from '../../beneficiary/entities/beneficiary.entity'
import {InfoRequest} from '../../infoRequest/entities/infoRequest.entity'
import {Coordinator} from '../../coordinator/entities/coordinator.entity'
import {RecurringDonation} from '../../recurringDonation/entities/recurringDonation.entity'


export class Person {
  id: string ;
firstName: string ;
lastName: string ;
email: string ;
emailConfirmed: boolean  | null;
phone: string  | null;
company: string  | null;
createdAt: Date ;
updatedAt: Date  | null;
newsletter: boolean  | null;
address: string  | null;
birthday: Date  | null;
personalNumber: string  | null;
keycloakId: string  | null;
stripeCustomerId: string  | null;
Donation?: Donation[] ;
expenses?: Expense[] ;
documents?: Document[] ;
transfers?: Transfer[] ;
campaigns?: Campaign[] ;
supporters?: Supporter[] ;
benefactors?: Benefactor[] ;
withdrawals?: Withdrawal[] ;
beneficiaries?: Beneficiary[] ;
infoRequests?: InfoRequest[] ;
coordinators?: Coordinator[] ;
recurringDonations?: RecurringDonation[] ;
}
