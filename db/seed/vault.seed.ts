import faker from 'faker'
import { CampaignState, Currency, PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function vaultSeed() {
  console.log('Vault seed')

  const campaign = await prisma.campaign.findFirst()

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
        amount: faker.datatype.number({ min: 1, max: 1000 }),
        campaignId: campaign.id,
        name: faker.finance.accountName(),
      }
    }),
    skipDuplicates: true,
  })
  console.log({ insert })

  console.log('Insert one vault for the completed campaign')
  const compltedCampaignVault = await prisma.vault.create({
    data: {
      currency: Currency.BGN,
      amount: 10000,
      campaignId: completedCampaign.id,
      name: faker.finance.accountName() + 'completed',
    },
  })
  console.log({ compltedCampaignVault })

  console.log('Insert one vault for the heavily funded campaign')
  const heavilyFundedCampaignVault = await prisma.vault.create({
    data: {
      currency: Currency.BGN,
      amount: 10000,
      campaignId: heavilyFundedCampaign.id,
      name: faker.finance.accountName() + 'heavily-funded',
    },
  })
  console.log({ heavilyFundedCampaignVault })
}
