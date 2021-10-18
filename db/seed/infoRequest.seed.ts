import faker from 'faker'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function infoRequestSeed() {
  console.log('Info requests seed')
  const persons = await prisma.person.findMany({ where: { newsletter: true } })

  const insert = await prisma.infoRequest.createMany({
    data: persons.map((person) => ({
      personId: person.id,
      message: faker.lorem.paragraph(),
    })),
    skipDuplicates: true,
  })
  console.log({ insert })
}
