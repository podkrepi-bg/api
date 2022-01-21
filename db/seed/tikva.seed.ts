import faker from 'faker'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function tikvaSeed() {
  console.log('Tikva seed')

  const insert = await prisma.tikva.createMany({
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
