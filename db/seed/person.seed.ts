import faker from 'faker'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function personSeed() {
  console.log('Persons seed')

  const insert = await prisma.person.createMany({
    data: [...Array(20).keys()].map(() => ({
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      email: faker.internet.email(),
      phone: faker.phone.phoneNumber('+359########'),
      company: faker.company.companyName(),
      address: faker.address.streetName() + ', ' + faker.address.cityName(),
      newsletter: faker.datatype.boolean(),
    })),
    skipDuplicates: true,
  })
  console.log({ insert })
}
