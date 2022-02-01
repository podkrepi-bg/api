import faker from 'faker'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function bootcampSeed() {
  console.log('Bootcamp seed')

  const insert = await prisma.bootcamp.createMany({
    data: [...Array(20).keys()].map(() => {
      return {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
      }
    }),
    skipDuplicates: true,
  })
  console.log({ insert })
}
