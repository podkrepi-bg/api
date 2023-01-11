import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'

import { Vault } from '.prisma/client'
import { Currency } from '@prisma/client'

export const vaultFactory = Factory.define<Vault>(({ associations }) => ({
  id: faker.datatype.uuid(),
  name: faker.finance.accountName(),
  campaignId: associations.campaignId || faker.datatype.uuid(),
  currency: faker.helpers.arrayElement(Object.values(Currency)),
  amount: faker.datatype.number(),
  blockedAmount: 0,
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
}))
