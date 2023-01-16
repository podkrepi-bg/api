import { faker } from '@faker-js/faker'
import { PrismaClient } from '@prisma/client'

import { Supporter } from '@prisma/client'
import { supporterFactory } from './factory'

const prisma = new PrismaClient()

export async function supportersSeed() {
  console.log('Supporters seed')

  const randomSupportersData: Supporter[] = await buildRandomSupporters()
  const insertSupporters = await prisma.supporter.createMany({
    data: randomSupportersData,
    skipDuplicates: true,
  })

  console.log({ insertSupporters })
}

async function buildRandomSupporters(): Promise<Supporter[]> {
  const persons = await prisma.person.findMany({ where: { newsletter: true } })

  return persons.map((person) => {
    return supporterFactory.build({}, { associations: { personId: person.id } })
  })
}
