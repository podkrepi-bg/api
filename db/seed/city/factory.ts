import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'

import { City } from '.prisma/client'

export const cityFactory = Factory.define<City>(({ associations }) => ({
  id: faker.datatype.uuid(),
  name: faker.address.city(),
  postalCode: faker.address.zipCode(),
  countryId: associations.countryId || faker.datatype.uuid(),
}))
