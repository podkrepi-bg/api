import { PrismaClient } from '@prisma/client'

import { citiesSeed } from './cities.seed'
import { personSeed } from './person.seed'
import { campaignSeed } from './campaign.seed'
import { countriesSeed } from './countries.seed'
import { supportersSeed } from './supporters.seed'
import { coordinatorSeed } from './coordinator.seed'
import { beneficiarySeed } from './beneficiary.seed'
import { infoRequestSeed } from './infoRequest.seed'
import { campaignTypesSeed } from './campaign-type.seed'

const prisma = new PrismaClient()

async function main() {
  await Promise.all([await countriesSeed(), await citiesSeed(), await campaignTypesSeed()])

  const isDevConfig = process.env.NODE_ENV == 'development'
  if (isDevConfig) {
    console.warn('Executing development seeds')
    await Promise.all([
      await personSeed(),
      await infoRequestSeed(),
      await supportersSeed(),
      await coordinatorSeed(),
      await beneficiarySeed(),
      await campaignSeed(),
    ])
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
