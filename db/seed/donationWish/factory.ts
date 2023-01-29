import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'

import { DonationWish } from '.prisma/client'

export const donationWishFactory = Factory.define<DonationWish>(({ associations }) => ({
  id: faker.datatype.uuid(),
  message: faker.lorem.paragraph(),
  campaignId: associations.campaignId || faker.datatype.uuid(),
  personId: associations.personId || null,
  donationId: associations.donationId || null,
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
}))
