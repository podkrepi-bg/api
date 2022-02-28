import { Benefactor } from '../../benefactor/entities/benefactor.entity'
import { Beneficiary } from '../../beneficiary/entities/beneficiary.entity'
import { Campaign } from '../../campaign/entities/campaign.entity'
import { Coordinator } from '../../coordinator/entities/coordinator.entity'
import { Document } from '../../document/entities/document.entity'
import { Donation } from '../../donation/entities/donation.entity'
import { Expense } from '../../expense/entities/expense.entity'
import { InfoRequest } from '../../infoRequest/entities/infoRequest.entity'
import { RecurringDonation } from '../../recurringDonation/entities/recurringDonation.entity'
import { Supporter } from '../../supporter/entities/supporter.entity'
import { Transfer } from '../../transfer/entities/transfer.entity'
import { Withdrawal } from '../../withdrawal/entities/withdrawal.entity'

export class Person {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  company: string | null
  createdAt: Date
  updatedAt: Date | null
  newsletter: boolean | null
  address: string | null
  birthday: Date | null
  emailConfirmed: boolean | null
  personalNumber: string | null
  keycloakId: string | null
  stripeCustomerId: string | null
  benefactors?: Benefactor[]
  beneficiaries?: Beneficiary[]
  campaigns?: Campaign[]
  coordinators?: Coordinator[]
  documents?: Document[]
  Donation?: Donation[]
  expenses?: Expense[]
  infoRequests?: InfoRequest[]
  recurringDonations?: RecurringDonation[]
  supporters?: Supporter[]
  transfers?: Transfer[]
  withdrawals?: Withdrawal[]
}
