import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'

import { Company } from '@prisma/client'

export const companyFactory = Factory.define<Company>(({ associations }) => ({
  id: faker.datatype.uuid(),
  companyName: faker.company.name(),
  companyNumber: faker.finance.account(9),
  legalPersonName: faker.name.fullName(),
  personId: null,
  countryCode: faker.address.countryCode(),
  cityId: associations.cityId || faker.datatype.uuid(),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
}))
