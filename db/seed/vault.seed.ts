import faker from 'faker'
import { Currency, PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function vaultSeed() {
  console.log('Vault seed')

  const campaign = await prisma.campaign.findFirst()
  // find the first campaign to get its ID so we can create a seed for the vaults and they will all be connected to this campaign for now

  if (!campaign) {
    throw new Error('There are no campaigns created yet!')
  }
  // check if campaigns are created if not throw an error (they are seeded so it should be fine)

  const insert = await prisma.vault.createMany({
    data: [
      {
        currency: Currency.BGN,
        amount: faker.datatype.number({ min: 1, max: 1000 }),
        campaignId: campaign.id,
      },
      {
        currency: Currency.BGN,
        amount: faker.datatype.number({ min: 1, max: 1000 }),
        campaignId: campaign.id,
      },
      {
        currency: Currency.BGN,
        amount: faker.datatype.number({ min: 1, max: 1000 }),
        campaignId: campaign.id,
      },
      {
        currency: Currency.BGN,
        amount: faker.datatype.number({ min: 1, max: 1000 }),
        campaignId: campaign.id,
      },
      {
        currency: Currency.BGN,
        amount: faker.datatype.number({ min: 1, max: 1000 }),
        campaignId: campaign.id,
      },
      {
        currency: Currency.BGN,
        amount: faker.datatype.number({ min: 1, max: 1000 }),
        campaignId: campaign.id,
      },
      {
        currency: Currency.BGN,
        amount: faker.datatype.number({ min: 1, max: 1000 }),
        campaignId: campaign.id,
      },
      {
        currency: Currency.BGN,
        amount: faker.datatype.number({ min: 1, max: 1000 }),
        campaignId: campaign.id,
      },
      {
        currency: Currency.BGN,
        amount: faker.datatype.number({ min: 1, max: 1000 }),
        campaignId: campaign.id,
      },
      {
        currency: Currency.BGN,
        amount: faker.datatype.number({ min: 1, max: 1000 }),
        campaignId: campaign.id,
      },
    ],
    skipDuplicates: true,
  })

  // With this we will create a seed with 10 vaults , random amount , all with BGN currency and all of them are related to the same campaign
  // campaign->vault  =  one-to-many relationship 1-n

  console.log({ insert })
}
