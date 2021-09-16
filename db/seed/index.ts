import { PrismaClient } from '@prisma/client'

import { countriesSeed } from './countries.seed'
import { campaignTypesSeed } from './campaign-type.seed'
import { citiesSeed } from './cities.seed'

const prisma = new PrismaClient()

async function main() {
  await Promise.all([await countriesSeed(), await citiesSeed(), await campaignTypesSeed()])
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
