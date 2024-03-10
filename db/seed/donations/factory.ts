import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'

import { Donation } from '.prisma/client'
import { DonationType } from '@prisma/client'

export const donationFactory = Factory.define<Donation>(({ associations }) => ({
  id: faker.datatype.uuid(),
  paymentId: associations.paymentId || faker.datatype.uuid(),
  type: faker.helpers.arrayElement(Object.values(DonationType)),
  targetVaultId: associations.targetVaultId || faker.datatype.uuid(),
  personId: associations.personId || null,
  amount: parseInt(faker.finance.amount(2000, 20000)),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
}))
