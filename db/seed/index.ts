import { PrismaClient } from '@prisma/client'

import { seedCampaignTypes } from './campaign-type.seed'

const prisma = new PrismaClient()

async function main() {
  await Promise.all([await seedCampaignTypes()])
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
