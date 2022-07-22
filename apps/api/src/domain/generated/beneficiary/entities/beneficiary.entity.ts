import { Prisma, BeneficiaryType, PersonRelation } from '@prisma/client'
import { Coordinator } from '../../coordinator/entities/coordinator.entity'
import { City } from '../../city/entities/city.entity'
import { Company } from '../../company/entities/company.entity'
import { Organizer } from '../../organizer/entities/organizer.entity'
import { Person } from '../../person/entities/person.entity'
import { Campaign } from '../../campaign/entities/campaign.entity'

export class Beneficiary {
  id: string
  type: BeneficiaryType
  personId: string | null
  organizerId: string | null
  countryCode: string
  cityId: string
  createdAt: Date
  updatedAt: Date | null
  organizerRelation: PersonRelation | null
  coordinatorRelation: PersonRelation | null
  description: string | null
  privateData: Prisma.JsonValue | null
  publicData: Prisma.JsonValue | null
  companyId: string | null
  coordinatorId: string | null
  coordinator?: Coordinator | null
  city?: City
  company?: Company | null
  organizer?: Organizer | null
  person?: Person | null
  campaigns?: Campaign[]
}
