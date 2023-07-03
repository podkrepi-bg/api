import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'

import { CampaignNews, CampaignNewsState } from '@prisma/client'

export const campaignNewsFactory = Factory.define<CampaignNews>(({ associations }) => ({
  id: faker.datatype.uuid(),
  campaignId: associations.campaignId || faker.datatype.uuid(),
  slug: faker.lorem.slug(),
  title: faker.lorem.sentence(3),
  publisherId: associations.publisherId || faker.datatype.uuid(),
  author: faker.name.fullName(),
  state: faker.helpers.arrayElement(Object.values(CampaignNewsState)),
  createdAt: faker.date.soon(3),
  publishedAt: faker.date.soon(3),
  editedAt: faker.date.recent(),
  sourceLink: faker.internet.domainName(),
  description: faker.lorem.paragraph(30),
}))
