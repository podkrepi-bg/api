import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'

import { Beneficiary } from '.prisma/client'
import { BeneficiaryType, PersonRelation } from '@prisma/client'

export const beneficiaryFactory = Factory.define<Beneficiary>(({ associations }) => ({
  id: faker.datatype.uuid(),
  type: BeneficiaryType.individual,
  description: faker.lorem.lines(1),
  privateData: null,
  publicData: null,
  personId: associations.personId || null,
  countryCode: faker.address.countryCode(),
  cityId: associations.cityId || faker.datatype.uuid(),
  coordinatorId: associations.coordinatorId || null,
  coordinatorRelation: PersonRelation.none,
  companyId: associations.companyId || null,
  organizerId: associations.organizerId || null,
  organizerRelation: PersonRelation.none,
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
}))
