import faker from 'faker'
import { PrismaClient, CampaignState, Currency } from '@prisma/client'

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

  const campaignTypeFromDb = await prisma.campaignType.findFirst()
  console.log(campaignTypeFromDb)

  if (!campaignTypeFromDb) {
    throw new Error('No campaign type')
  }

  const insert = await prisma.campaign.createMany({
    data: [...Array(20).keys()].map(() => {
      const title = faker.lorem.sentence()
      return {
        state: CampaignState.active,
        slug: faker.helpers.slugify(title),
        title,
        essence: faker.company.catchPhrase(),
        coordinatorId: coordinatorFromDb.id,
        beneficiaryId: beneficiaryFromDb.id,
        campaignTypeId: campaignTypeFromDb.id,
        description: faker.lorem.paragraphs(4),
        targetAmount: faker.finance.amount(2000, 200000),
        currency: Currency.BGN,
      }
    }),
    skipDuplicates: true,
  })
  console.log({ insert })
}
