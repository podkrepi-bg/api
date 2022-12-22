import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'

import { Coordinator } from '.prisma/client'

export const coordinatorFactory = Factory.define<Coordinator>(({ associations }) => ({
  id: faker.datatype.uuid(),
  personId: associations.personId || faker.datatype.uuid(),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
}))
