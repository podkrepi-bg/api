import { faker } from '@faker-js/faker'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function personSeed() {
  console.log('Persons seed')

  const insertDefaultUsers = await prisma.person.createMany({
    data: [
      {
        firstName: 'Admin',
        lastName: 'Dev',
        email: 'admin@podkrepi.bg',
        company: 'Podkrepi.bg',
        keycloakId: '6892fe15-d116-4aec-a417-82ebd990b63a',
      },
      {
        firstName: 'Coordinator',
        lastName: 'Dev',
        email: 'coordinator@podkrepi.bg',
        company: 'Podkrepi.bg',
        keycloakId: '81d93c73-db28-4402-8ec0-a5b1709ed1cf',
      },
      {
        firstName: 'Giver',
        lastName: 'Dev',
        email: 'giver@podkrepi.bg',
        company: 'Podkrepi.bg',
        keycloakId: '190486ff-7f0e-4e28-94ca-b624726b5389',
      },
      {
        firstName: 'Receiver',
        lastName: 'Dev',
        email: 'receiver@podkrepi.bg',
        company: 'Podkrepi.bg',
        keycloakId: '6c688460-73ec-414c-8252-986b0658002b',
      },
      {
        firstName: 'Reviewer',
        lastName: 'Dev',
        email: 'reviewer@podkrepi.bg',
        company: 'Podkrepi.bg',
        keycloakId: '36bec201-b203-46ad-a8c3-43a0128c73e1',
      },
    ],
    skipDuplicates: true,
  })
  console.log({ insertDefaultUsers })

  const insert = await prisma.person.createMany({
    data: [...Array(10).keys()].map(() => ({
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      email: faker.internet.email(),
      picture: faker.image.imageUrl(),
      phone: faker.phone.number('+359########'),
      company: faker.company.name(),
      address: faker.address.streetName() + ', ' + faker.address.cityName(),
      newsletter: faker.datatype.boolean(),
    })),
    skipDuplicates: true,
  })
  console.log({ insert })
}
