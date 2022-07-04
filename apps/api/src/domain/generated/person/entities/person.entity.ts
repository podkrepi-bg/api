import { Benefactor } from '../../benefactor/entities'
import { Beneficiary } from '../../beneficiary/entities'
import { Campaign } from '../../campaign/entities'
import { Organizer } from '../../organizer/entities'
import { Coordinator } from '../../coordinator/entities'
import { Document } from '../../document/entities'
import { Donation } from '../../donation/entities'
import { Expense } from '../../expense/entities'
import { InfoRequest } from '../../infoRequest/entities'
import { RecurringDonation } from '../../recurringDonation/entities'
import { Supporter } from '../../supporter/entities'
import { Transfer } from '../../transfer/entities'
import { Withdrawal } from '../../withdrawal/entities'
import { CampaignFile } from '../../campaignFile/entities'
import { Irregularity } from '../../irregularity/entities'
import { IrregularityFile } from '../../irregularityFile/entities'

export class Person {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  picture: string | null
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
  organizer?: Organizer[]
  coordinators?: Coordinator[]
  documents?: Document[]
  Donation?: Donation[]
  expenses?: Expense[]
  infoRequests?: InfoRequest[]
  recurringDonations?: RecurringDonation[]
  supporters?: Supporter[]
  transfers?: Transfer[]
  withdrawals?: Withdrawal[]
  campaignFiles?: CampaignFile[]
  irregularities?: Irregularity[]
  irregularityFiles?: IrregularityFile[]
}
