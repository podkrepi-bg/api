import { CampaignState, Currency } from '@prisma/client'
import { Person } from '../../person/entities/person.entity'
import { Beneficiary } from '../../beneficiary/entities/beneficiary.entity'
import { CampaignType } from '../../campaignType/entities/campaignType.entity'
import { Coordinator } from '../../coordinator/entities/coordinator.entity'
import { Transfer } from '../../transfer/entities/transfer.entity'
import { Vault } from '../../vault/entities/vault.entity'
import { Withdrawal } from '../../withdrawal/entities/withdrawal.entity'
import { CampaignFile } from '../../campaignFile/entities/campaignFile.entity'
import { Irregularity } from '../../irregularity/entities/irregularity.entity'

export class Campaign {
  id: string
  state: CampaignState
  slug: string
  title: string
  essence: string
  paymentReference: string
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
