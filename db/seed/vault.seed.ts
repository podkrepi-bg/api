import { faker } from '@faker-js/faker'
import { Currency, PrismaClient, CampaignState } from '@prisma/client'
const prisma = new PrismaClient()

export async function vaultSeed() {
  console.log('Vault seed')

  const campaign = await prisma.campaign
    .findMany()
    .then((campaigns) => faker.helpers.arrayElement(campaigns))

  const completedCampaign = await prisma.campaign.findFirst({
    where: {
      state: CampaignState.complete,
    },
  })

  const heavilyFundedCampaign = await prisma.campaign.findFirst({
    where: {
      title: {
        contains: 'heavily-funded',
      },
    },
  })

  if (!campaign) {
    throw new Error('There are no campaigns created yet!')
  }

  if (!completedCampaign) {
    throw new Error('There is no completed campaign created')
  }

  if (!heavilyFundedCampaign) {
    throw new Error('There is no heavily funded campaign created')
  }

  console.log('Insert 20 vaults for the first campaign')
  const insert = await prisma.vault.createMany({
    data: [...Array(20).keys()].map(() => {
      return {
        currency: Currency.BGN,
        amount: 0, // Initializing with 0 and fill the correct amount after donations have been seeded
        campaignId: campaign.id,
        name: faker.finance.accountName(),
      }
    }),
    skipDuplicates: true,
  })
  console.log({ insert })

  console.log('Insert one vault for the completed campaign')
  const completedCampaignVault = await prisma.vault.create({
    data: {
      currency: Currency.BGN,
      amount: 0, // Initializing with 0 and fill the correct amount after donations have been seeded
      campaignId: completedCampaign.id,
      name: faker.finance.accountName() + 'completed',
    },
  })
  console.log({ completedCampaignVault })

  console.log('Insert one vault for the heavily funded campaign')
  const heavilyFundedCampaignVault = await prisma.vault.create({
    data: {
      currency: Currency.BGN,
      amount: 0, // Initializing with 0 and fill the correct amount after donations have been seeded
      campaignId: heavilyFundedCampaign.id,
      name: faker.finance.accountName() + 'heavily-funded',
    },
  })
  console.log({ heavilyFundedCampaignVault })
}
