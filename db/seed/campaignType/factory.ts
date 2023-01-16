import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'

import { CampaignType, CampaignTypeCategory } from '@prisma/client'

export const campaignTypeFactory = Factory.define<CampaignType>(({ associations }) => ({
  id: faker.datatype.uuid(),
  name: faker.lorem.words().toUpperCase(),
  slug: faker.lorem.slug(),
  description: faker.lorem.sentence(5),
  parentId: associations.parentId || faker.datatype.uuid(),
  category: faker.helpers.arrayElement(Object.values(CampaignTypeCategory)),
}))
