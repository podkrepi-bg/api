import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker'

import { citiesSeed } from './city/seed'
import { personSeed } from './person/seed'
import { campaignSeed } from './campaign/seed'
import { countriesSeed } from './country/seed'
import { supportersSeed } from './supporter/seed'
import { coordinatorSeed } from './coordinator/seed'
import { beneficiarySeed } from './beneficiary/seed'
import { infoRequestSeed } from './infoRequest/seed'
import { campaignTypesSeed } from './campaignType/seed'
import { bankAccountSeed } from './bankAccount/seed'
import { vaultSeed } from './vault/seed'
import { expenseSeed } from './expense/seed'
import { donationsSeed } from './donation/seed'
import { companySeed } from './company/seed'
import { donationsWishesSeed } from './donationWish/seed'

const prisma = new PrismaClient()

async function main() {
  faker.seed(1)
  await seedEssentialData()
  await seedDevData()
}

/**
 * Seed all essential tables which are required for the normal operation
 * of the system and are not dependant on the environment
 */
async function seedEssentialData() {
  console.warn('\x1b[33m Executing essential seeds: \x1b[0m')
  return Promise.all([await countriesSeed(), await citiesSeed(), await campaignTypesSeed()])
}

/**
 * Seed demo data which can be used by the developers to interact with
 * a preview of the system and showcase the different features easily
 */
async function seedDevData() {
  const isDevConfig = process.env.NODE_ENV == 'development'
  if (isDevConfig) {
    console.warn('\x1b[33m Executing development seeds: \x1b[0m')
    await personSeed()
    await companySeed()
    await infoRequestSeed()
    await supportersSeed()
    await coordinatorSeed()
    await beneficiarySeed()
    await campaignSeed()
    await bankAccountSeed()
    await vaultSeed()
    await expenseSeed()
    await donationsSeed()
    await donationsWishesSeed()
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
