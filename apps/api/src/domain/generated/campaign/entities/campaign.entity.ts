import { CampaignState, Currency } from '@prisma/client'
import { Person } from '../../person/entities'
import { Organizer } from '../../organizer/entities'
import { Beneficiary } from '../../beneficiary/entities'
import { CampaignType } from '../../campaignType/entities'
import { Coordinator } from '../../coordinator/entities'
import { Transfer } from '../../transfer/entities'
import { Vault } from '../../vault/entities'
import { Withdrawal } from '../../withdrawal/entities'
import { CampaignFile } from '../../campaignFile/entities'
import { Irregularity } from '../../irregularity/entities'

export class Campaign {
  id: string
  state: CampaignState
  slug: string
  title: string
  essence: string
  paymentReference: string
  organizerId: string | null
  coordinatorId: string
  beneficiaryId: string
  campaignTypeId: string
  description: string | null
  targetAmount: number | null
  allowDonationOnComplete: boolean
  startDate: Date | null
  endDate: Date | null
  createdAt: Date
  updatedAt: Date | null
  deletedAt: Date | null
  approvedById: string | null
  currency: Currency
  approvedBy?: Person | null
  organizer?: Organizer | null
  beneficiary?: Beneficiary
  campaignType?: CampaignType
  coordinator?: Coordinator
  outgoingTransfers?: Transfer[]
  incomingTransfers?: Transfer[]
  vaults?: Vault[]
  withdrawals?: Withdrawal[]
  campaignFiles?: CampaignFile[]
  irregularities?: Irregularity[]
}
