import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'

import { Country } from '.prisma/client'

export const countryFactory = Factory.define<Country>(() => ({
  id: faker.datatype.uuid(),
  name: faker.address.country(),
  countryCode: faker.address.countryCode(),
}))
