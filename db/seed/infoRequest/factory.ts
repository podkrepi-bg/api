import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'

import { InfoRequest } from '@prisma/client'

export const infoRequestFactory = Factory.define<InfoRequest>(({ associations }) => ({
  id: faker.datatype.uuid(),
  personId: associations.personId || faker.datatype.uuid(),
  message: faker.lorem.paragraph(),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  deletedAt: null,
}))
