import { Person } from '../../person/entities/person.entity'
import { Beneficiary } from '../../beneficiary/entities/beneficiary.entity'

export class Coordinator {
  id: string
  personId: string
  createdAt: Date
  updatedAt: Date | null
  person?: Person
  beneficiaries?: Beneficiary[]
}
