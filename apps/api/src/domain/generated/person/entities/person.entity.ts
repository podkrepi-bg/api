import { Benefactor } from '../../benefactor/entities/benefactor.entity'
import { Beneficiary } from '../../beneficiary/entities/beneficiary.entity'
import { CampaignFile } from '../../campaignFile/entities/campaignFile.entity'
import { CampaignReport } from '../../campaignReport/entities/campaignReport.entity'
import { CampaignReportFile } from '../../campaignReportFile/entities/campaignReportFile.entity'
import { Campaign } from '../../campaign/entities/campaign.entity'
import { Coordinator } from '../../coordinator/entities/coordinator.entity'
import { Document } from '../../document/entities/document.entity'
import { DonationWish } from '../../donationWish/entities/donationWish.entity'
import { Donation } from '../../donation/entities/donation.entity'
import { Expense } from '../../expense/entities/expense.entity'
import { InfoRequest } from '../../infoRequest/entities/infoRequest.entity'
import { Irregularity } from '../../irregularity/entities/irregularity.entity'
import { IrregularityFile } from '../../irregularityFile/entities/irregularityFile.entity'
import { Organizer } from '../../organizer/entities/organizer.entity'
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
  picture: string | null
  benefactors?: Benefactor[]
  beneficiaries?: Beneficiary[]
  campaignFiles?: CampaignFile[]
  campaignReports?: CampaignReport[]
  campaignReportFiles?: CampaignReportFile[]
  campaigns?: Campaign[]
  coordinators?: Coordinator | null
  documents?: Document[]
  donationWish?: DonationWish[]
  Donation?: Donation[]
  expenses?: Expense[]
  infoRequests?: InfoRequest[]
  irregularities?: Irregularity[]
  irregularityFiles?: IrregularityFile[]
  organizer?: Organizer | null
  recurringDonations?: RecurringDonation[]
  supporters?: Supporter[]
  transfers?: Transfer[]
  withdrawals?: Withdrawal[]
}
