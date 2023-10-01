import { faker } from '@faker-js/faker'
import { Currency, PrismaClient, CampaignState, Vault } from '@prisma/client'
import { vaultFactory } from './factory'

const prisma = new PrismaClient()

export async function vaultSeed() {
  console.log('Vault seed')

  await seedVaultsForCampaigns()

  async function seedVaultsForCampaigns() {
    const campaigns = await prisma.campaign.findMany()

    if (!campaigns) {
      throw new Error('There are no campaigns created yet!')
    }

    let vaults: Vault[] = []
    campaigns.map(async (campaign) => {
      vaults.push(
        vaultFactory.build(
          {
            currency: Currency.BGN,
            amount: 0, // Initializing with 0 and fill the correct amount after donations have been seeded
          },
          {
            associations: {
              campaignId: campaign.id,
            },
          },
        ),
      )
    })

    const insertRandomCampaignVaults = await prisma.vault.createMany({
      data: vaults,
      skipDuplicates: true,
    })

    console.log({ insertRandomCampaignVaults })
  }
}
