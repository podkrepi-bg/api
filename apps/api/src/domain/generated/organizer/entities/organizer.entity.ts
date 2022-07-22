import { Person } from '../../person/entities/person.entity'
import { Campaign } from '../../campaign/entities/campaign.entity'
import { Beneficiary } from '../../beneficiary/entities/beneficiary.entity'

export class Organizer {
  id: string
  personId: string
  createdAt: Date
  updatedAt: Date | null
  person?: Person
  campaigns?: Campaign[]
  beneficiaries?: Beneficiary[]
}
