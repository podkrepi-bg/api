import { faker } from '@faker-js/faker'
import {
  PrismaClient,
  CampaignState,
  BeneficiaryType,
  CampaignType,
  Coordinator,
  Beneficiary,
} from '@prisma/client'

import { campaignFactory } from './factory'

const prisma = new PrismaClient()

const SEED_ACTIVE_CAMPAIGNS = 5
const SEED_RANDOM_CAMPAIGNS = 5
const SEED_COMPLETED_CAMPAIGNS = 3
const SEED_HEAVILY_FUNDED_CAMPAIGNS = 1

export async function campaignSeed() {
  console.log('Campaigns seed')

  const coordinatorFromDb = await prisma.coordinator.findFirst()
  if (!coordinatorFromDb) {
    throw new Error('No coordinator')
  }

  const beneficiaryPersonFromDb = await prisma.beneficiary
    .findMany({
      where: { person: { email: 'receiver@podkrepi.bg' } },
    })
    .then((beneficiaries) => faker.helpers.arrayElement(beneficiaries))

  if (!beneficiaryPersonFromDb) {
    throw new Error('No beneficiary person found')
  }

  const beneficiaryCompanyFromDb = await prisma.beneficiary
    .findMany({
      where: { type: BeneficiaryType.company },
    })
    .then((beneficiaries) => faker.helpers.arrayElement(beneficiaries))

  if (!beneficiaryCompanyFromDb) {
    throw new Error('No beneficiary campaign found')
  }

  const campaignTypeFromDb = await prisma.campaignType.findMany()
  if (!campaignTypeFromDb) {
    throw new Error('No campaign type')
  }

  await seedActiveCampaigns({
    campaignTypes: campaignTypeFromDb,
    coordinator: coordinatorFromDb,
    beneficiary: beneficiaryPersonFromDb,
  })

  await seedRandomCampaigns({
    campaignTypes: campaignTypeFromDb,
    coordinator: coordinatorFromDb,
    beneficiary: beneficiaryCompanyFromDb,
  })

  await seedCompletedCampaigns({
    campaignTypes: campaignTypeFromDb,
    coordinator: coordinatorFromDb,
    beneficiary: beneficiaryCompanyFromDb,
  })

  await seedHeavilyFundedCampaigns({
    campaignTypes: campaignTypeFromDb,
    coordinator: coordinatorFromDb,
    beneficiary: beneficiaryCompanyFromDb,
  })
}

interface SeedData {
  campaignTypes: CampaignType[]
  coordinator: Coordinator
  beneficiary: Beneficiary
}

async function seedActiveCampaigns({ campaignTypes, coordinator, beneficiary }: SeedData) {
  const activeCampaignsData = campaignFactory.buildList(
    SEED_ACTIVE_CAMPAIGNS,
    {
      state: CampaignState.active,
    },
    {
      associations: {
        coordinatorId: coordinator.id,
        beneficiaryId: beneficiary.id,
        campaignTypeId: faker.helpers.arrayElement(campaignTypes).id,
      },
    },
  )

  const insertActiveCampaigns = await prisma.campaign.createMany({
    data: activeCampaignsData,
    skipDuplicates: true,
  })

  console.log({ insertActiveCampaigns })
}

async function seedRandomCampaigns({ campaignTypes, coordinator, beneficiary }: SeedData) {
  const companyFromDb = await prisma.company.findFirst()
  if (!companyFromDb) {
    throw new Error('No company')
  }

  const randomCampaignsData = campaignFactory.buildList(
    SEED_RANDOM_CAMPAIGNS,
    {},
    {
      associations: {
        coordinatorId: coordinator.id,
        beneficiaryId: beneficiary.id,
        companyId: companyFromDb.id,
        campaignTypeId: faker.helpers.arrayElement(campaignTypes).id,
      },
    },
  )

  const insertRandomCampaigns = await prisma.campaign.createMany({
    data: randomCampaignsData,
    skipDuplicates: true,
  })

  console.log({ insertRandomCampaigns })
}

async function seedCompletedCampaigns({ campaignTypes, coordinator, beneficiary }: SeedData) {
  const completedCampaignsData = campaignFactory.buildList(
    SEED_COMPLETED_CAMPAIGNS,
    {
      state: CampaignState.complete,
      title: faker.lorem.sentence(3) + 'completed',
    },
    {
      associations: {
        coordinatorId: coordinator.id,
        beneficiaryId: beneficiary.id,
        campaignTypeId: faker.helpers.arrayElement(campaignTypes).id,
      },
    },
  )

  const insertCompletedCampaigns = await prisma.campaign.createMany({
    data: completedCampaignsData,
    skipDuplicates: true,
  })

  console.log({ insertCompletedCampaigns })
}

async function seedHeavilyFundedCampaigns({ campaignTypes, coordinator, beneficiary }: SeedData) {
  const heavilyFundedCampaignsData = campaignFactory.buildList(
    SEED_HEAVILY_FUNDED_CAMPAIGNS,
    {
      state: CampaignState.active,
      title: faker.lorem.sentence(3) + 'heavily-funded',
    },
    {
      associations: {
        coordinatorId: coordinator.id,
        beneficiaryId: beneficiary.id,
        campaignTypeId: faker.helpers.arrayElement(campaignTypes).id,
      },
    },
  )

  const insertHeavilyFundedCampaigns = await prisma.campaign.createMany({
    data: heavilyFundedCampaignsData,
    skipDuplicates: true,
  })

  console.log({ insertHeavilyFundedCampaigns })
}
