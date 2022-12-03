import { faker } from '@faker-js/faker'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function companySeed() {
  console.log('Companies seed')

  console.log('Insert 5 companies')
  await prisma.company.createMany({
    data: [...Array(13).keys()].map(() => {
      return {
        companyName: faker.company.name(),
        companyNumber: faker.finance.account(9),
        legalPersonName: faker.name.firstName() + ' ' + faker.name.lastName(),
        countryCode: faker.address.countryCode(),
        cityId: faker.datatype.uuid(),
      }
    }),
    skipDuplicates: true,
  })
}
