import { faker } from '@faker-js/faker'
import { PrismaClient, CampaignState, Currency, BeneficiaryType } from '@prisma/client'
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

  const beneficiaryPersonFromDb = await prisma.beneficiary
    .findMany({
      where: { person: { email: 'receiver@podkrepi.bg' } },
    })
    .then((beneficiaries) => faker.helpers.arrayElement(beneficiaries))

  if (!beneficiaryPersonFromDb) {
    throw new Error('No beneficiary')
  }

  const beneficiaryCompanyFromDb = await prisma.beneficiary
    .findMany({
      where: { type: BeneficiaryType.company },
    })
    .then((beneficiaries) => faker.helpers.arrayElement(beneficiaries))

  if (!beneficiaryCompanyFromDb) {
    throw new Error('No beneficiary')
  }

  const companyFromDb = await prisma.company.findFirst()
  console.log(companyFromDb)
  if (!companyFromDb) {
    throw new Error('No company')
  }

  const campaignTypeFromDb = await prisma.campaignType.findMany()
  console.log(campaignTypeFromDb)

  if (!campaignTypeFromDb) {
    throw new Error('No campaign type')
  }

  console.log('Insert 5 active campaigns')
  const activeCampaigns = await prisma.campaign.createMany({
    data: [...Array(5).keys()].map(() => {
      const title = faker.lorem.sentence(3)
      const randomType = campaignTypeFromDb[Math.floor(Math.random() * campaignTypeFromDb.length)]
      return {
        state: CampaignState.active,
        slug: faker.helpers.slugify(title).replace('.', '').toLowerCase(),
        title,
        essence: faker.company.catchPhrase(),
        coordinatorId: coordinatorFromDb.id,
        beneficiaryId: beneficiaryPersonFromDb.id,
        campaignTypeId: randomType.id,
        description: faker.lorem.paragraphs(1),
        targetAmount: parseInt(faker.finance.amount(2000, 200000)),
        currency: Currency.BGN,
        paymentReference: getPaymentReference(),
        startDate: faker.date.soon(3),
        endDate: faker.date.soon(60),
      }
    }),
    skipDuplicates: true,
  })
  console.log({ activeCampaigns })

  console.log('Insert 5 more random state campaigns with companies')
  const randomCampaigns = await prisma.campaign.createMany({
    data: [...Array(5).keys()].map(() => {
      const title = faker.lorem.sentence(3)
      const randomType = campaignTypeFromDb[Math.floor(Math.random() * campaignTypeFromDb.length)]
      return {
        state: faker.helpers.arrayElement(Object.values(CampaignState)),
        slug: faker.helpers.slugify(title).replace('.', '').toLowerCase(),
        title,
        essence: faker.company.catchPhrase(),
        coordinatorId: coordinatorFromDb.id,
        beneficiaryId: beneficiaryCompanyFromDb.id,
        campaignTypeId: randomType.id,
        companyId: companyFromDb.id,
        description: faker.lorem.paragraphs(1),
        targetAmount: parseInt(faker.finance.amount(2000, 200000)),
        currency: Currency.BGN,
        paymentReference: getPaymentReference(),
        startDate: faker.date.soon(3),
        endDate: faker.date.soon(60),
      }
    }),
    skipDuplicates: true,
  })
  console.log({ randomCampaigns })

  console.log('Insert 1 completed campaign')
  const completedCampaignTitle = faker.lorem.sentence(3) + 'completed'
  const completedCampaign = await prisma.campaign.create({
    data: {
      state: CampaignState.complete,
      slug: faker.helpers.slugify(completedCampaignTitle).replace('.', '').toLowerCase(),
      title: completedCampaignTitle,
      essence: faker.company.catchPhrase(),
      coordinatorId: coordinatorFromDb.id,
      beneficiaryId: beneficiaryFromDb.id,
      campaignTypeId: campaignTypeFromDb[Math.floor(Math.random() * campaignTypeFromDb.length)].id,
      description: faker.lorem.paragraphs(1),
      targetAmount: 100 * 100,
      currency: Currency.BGN,
      paymentReference: getPaymentReference(),
      startDate: faker.date.soon(3),
      endDate: faker.date.soon(60),
    },
  })
  console.log({ completedCampaign })

  console.log('Insert 1 heavily funded campaign')
  const heavilyFundedCampaignTitle = faker.lorem.sentence(3) + 'heavily-funded'
  const heavilyFundedCampaign = await prisma.campaign.create({
    data: {
      state: CampaignState.active,
      slug: faker.helpers.slugify(heavilyFundedCampaignTitle).replace('.', '').toLowerCase(),
      title: heavilyFundedCampaignTitle,
      essence: faker.company.catchPhrase(),
      coordinatorId: coordinatorFromDb.id,
      beneficiaryId: beneficiaryFromDb.id,
      campaignTypeId: campaignTypeFromDb[Math.floor(Math.random() * campaignTypeFromDb.length)].id,
      description: faker.lorem.paragraphs(1),
      targetAmount: 250 * 100,
      currency: Currency.BGN,
      paymentReference: getPaymentReference(),
      startDate: faker.date.soon(3),
      endDate: faker.date.soon(60),
    },
  })
  console.log({ heavilyFundedCampaign })
}
