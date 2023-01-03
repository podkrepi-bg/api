import { faker } from '@faker-js/faker'
import { PrismaClient } from '@prisma/client'

import { Company } from '.prisma/client'
import { companyFactory } from './factory'

const prisma = new PrismaClient()

export async function companySeed() {
  console.log('Companies seed')

  const randomCompaniesData: Company[] = companyFactory.buildList(13)
  const insertCompanies = await prisma.company.createMany({
    data: randomCompaniesData,
    skipDuplicates: true,
  })

  console.log({ insertCompanies })
}
