import { faker } from '@faker-js/faker'
import { Currency, PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function vaultSeed() {
  console.log('Vault seed')

  const campaign = await prisma.campaign.findFirst()

  if (!campaign) {
    throw new Error('There are no campaigns created yet!')
  }

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
}
