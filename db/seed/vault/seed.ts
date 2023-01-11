import { faker } from '@faker-js/faker'
import { Currency, PrismaClient, CampaignState, Vault } from '@prisma/client'
import { vaultFactory } from './factory'

const prisma = new PrismaClient()

export async function vaultSeed() {
  console.log('Vault seed')

  await seedVaultsForRandomCampaign()
  await seedVaultForCompletedCampaign()
  await seedVaultForHeavilyFundedCampaign()
}

async function seedVaultsForRandomCampaign() {
  const campaign = await prisma.campaign
    .findMany()
    .then((campaigns) => faker.helpers.arrayElement(campaigns))

  if (!campaign) {
    throw new Error('There are no campaigns created yet!')
  }

  const randomCampaignVaultsData: Vault[] = vaultFactory.buildList(
    20,
    {
      currency: Currency.BGN,
      amount: 0, // Initializing with 0 and fill the correct amount after donations have been seeded
    },
    {
      associations: {
        campaignId: campaign.id,
      },
    },
  )

  const insertRandomCampaignVaults = await prisma.vault.createMany({
    data: randomCampaignVaultsData,
    skipDuplicates: true,
  })

  console.log({ insertRandomCampaignVaults })
}

async function seedVaultForHeavilyFundedCampaign() {
  const completedCampaign = await prisma.campaign.findFirst({
    where: {
      state: CampaignState.complete,
    },
  })

  if (!completedCampaign) {
    throw new Error('There is no completed campaign created')
  }

  const completedCampaignVaultData: Vault = vaultFactory.build(
    {
      name: faker.finance.accountName() + ' completed',
      currency: Currency.BGN,
      amount: 0, // Initializing with 0 and fill the correct amount after donations have been seeded
    },
    {
      associations: {
        campaignId: completedCampaign.id,
      },
    },
  )

  const insertCompletedCampaignVault = await prisma.vault.create({
    data: completedCampaignVaultData,
  })

  console.log(`{ insertCompletedCampaignVault: ${!!insertCompletedCampaignVault} }`)
}

async function seedVaultForCompletedCampaign() {
  const heavilyFundedCampaign = await prisma.campaign.findFirst({
    where: {
      title: {
        contains: 'heavily-funded',
      },
    },
  })

  if (!heavilyFundedCampaign) {
    throw new Error('There is no heavily funded campaign created')
  }

  const heavilyFundedCampaignVaultData: Vault = vaultFactory.build(
    {
      name: faker.finance.accountName() + ' heavily-funded',
      currency: Currency.BGN,
      amount: 0, // Initializing with 0 and fill the correct amount after donations have been seeded
    },
    {
      associations: {
        campaignId: heavilyFundedCampaign.id,
      },
    },
  )

  const insertHeavilyFundedCampaignVault = await prisma.vault.create({
    data: heavilyFundedCampaignVaultData,
  })

  console.log(`{ insertHeavilyFundedCampaignVault: ${!!insertHeavilyFundedCampaignVault} }`)
}
