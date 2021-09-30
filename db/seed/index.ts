import { PrismaClient } from '@prisma/client'

import { countriesSeed } from './countries.seed'
import { campaignTypesSeed } from './campaign-type.seed'
import { citiesSeed } from './cities.seed'
import { personSeed } from './person.seed'
import { coordinatorSeed } from './coordinator.seed'
import { beneficiarySeed } from './beneficiary.seed'
import { campaignSeed } from './campaign.seed'

const prisma = new PrismaClient()

async function main() {
  await Promise.all([
    await countriesSeed(),
    await citiesSeed(),
    await campaignTypesSeed()])

  const isDevConfig = process.env.NODE_ENV == 'development'
  if (isDevConfig) {
    console.warn('Executing development seeds')
    await Promise.all([
      await personSeed(),
      await coordinatorSeed(),
      await beneficiarySeed(),
      await campaignSeed()
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
