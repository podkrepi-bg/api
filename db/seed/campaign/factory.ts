import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'

import { Campaign } from '.prisma/client'
import { CampaignState, Currency } from '@prisma/client'

import { getPaymentReference } from '../../../apps/api/src/campaign/helpers/payment-reference'

export const campaignFactory = Factory.define<Campaign>(({ associations }) => ({
  id: faker.datatype.uuid(),
  state: faker.helpers.arrayElement(Object.values(CampaignState)),
  title: faker.lorem.sentence(3),
  slug: faker.lorem.slug(),
  essence: faker.company.catchPhrase(),
  description: faker.lorem.paragraphs(1),
  coordinatorId: associations.coordinatorId || faker.datatype.uuid(),
  beneficiaryId: associations.beneficiaryId || faker.datatype.uuid(),
  campaignTypeId: associations.campaignTypeId || faker.datatype.uuid(),
  organizerId: associations.organizerId ?? null,
  companyId: associations.companyId ?? null,
  approvedById: associations.approvedById || null,
  currency: Currency.EUR,
  targetAmount: parseInt(faker.finance.amount(2000, 200000)),
  allowDonationOnComplete: faker.datatype.boolean(),
  paymentReference: getPaymentReference(),
  startDate: faker.date.soon(3),
  endDate: faker.date.soon(60),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  deletedAt: null,
}))
