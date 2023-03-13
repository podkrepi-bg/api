import { Beneficiary } from '../../beneficiary/entities/beneficiary.entity'
import { Campaign } from '../../campaign/entities/campaign.entity'

export class Company {
  id: string
  companyName: string
  companyNumber: string
  legalPersonName: string | null
  countryCode: string | null
  cityId: string | null
  createdAt: Date
  updatedAt: Date | null
  beneficiaries?: Beneficiary[]
  Campaign?: Campaign[]
}
