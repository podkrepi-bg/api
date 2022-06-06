import faker from 'faker'
import { PrismaClient, CampaignState, Currency } from '@prisma/client'
import { getPaymentReference } from '../../apps/api/src/campaign/helpers/payment-reference'

const prisma = new PrismaClient()

export async function campaignSeed() {
  console.log('Campaigns seed')

  const persons = await prisma.person.findMany({ where: { newsletter: true } })
  console.log(persons)

  if (!persons) {
    throw new Error('No persons subscribed to newsletter')
  }

  const coordinatorFromDb = await prisma.coordinator.findFirst()
  console.log(coordinatorFromDb)

  if (!coordinatorFromDb) {
    throw new Error('No coordinator')
  }

  const beneficiaryFromDb = await prisma.beneficiary.findFirst()
  console.log(beneficiaryFromDb)

  if (!beneficiaryFromDb) {
    throw new Error('No beneficiary')
  }

  const campaignTypeFromDb = await prisma.campaignType.findMany()
  console.log(campaignTypeFromDb)

  if (!campaignTypeFromDb) {
    throw new Error('No campaign type')
  }

  const insert = await prisma.campaign.createMany({
    data: [...Array(20).keys()].map(() => {
      const title = faker.lorem.sentence()
      const randomType = campaignTypeFromDb[Math.floor(Math.random() * campaignTypeFromDb.length)]
      return {
        state: CampaignState.active,
        slug: faker.helpers.slugify(title).replace('.', '').toLowerCase(),
        title,
        essence: faker.company.catchPhrase(),
        coordinatorId: coordinatorFromDb.id,
        beneficiaryId: beneficiaryFromDb.id,
        campaignTypeId: randomType.id,
        description: faker.lorem.paragraphs(4),
        targetAmount: parseInt(faker.finance.amount(2000, 200000)),
        currency: Currency.BGN,
        paymentReference: getPaymentReference(),
        startDate: faker.date.soon(3),
        endDate: faker.date.soon(60),
      }
    }),
    skipDuplicates: true,
  })
  console.log({ insert })
}
