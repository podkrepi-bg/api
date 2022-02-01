import faker from 'faker'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function bootcampSeed() {
  console.log('Bootcamp seed')

  const insert = await prisma.bootcamp.createMany({
    data: [{ firstName: 'Test', lastName: 'Test' }],
    skipDuplicates: true,
  })
  console.log({ insert })
}
