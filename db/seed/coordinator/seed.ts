import { PrismaClient } from '@prisma/client'

import { Coordinator } from '@prisma/client'
import { coordinatorFactory } from './factory'

const prisma = new PrismaClient()

export async function coordinatorSeed() {
  console.log('Coordinators seed')

  const randomCoordinatorsData: Coordinator[] = await buildRandomCoordinators()
  const insertCoordinators = await prisma.coordinator.createMany({
    data: randomCoordinatorsData,
    skipDuplicates: true,
  })

  console.log({ insertCoordinators })
}

async function buildRandomCoordinators(): Promise<Coordinator[]> {
  const persons = await prisma.person.findMany({ where: { newsletter: true } })

  if (!persons) {
    throw new Error('No persons subscribed to newsletter')
  }

  return persons.slice(0, persons.length / 2).map((person) => {
    return coordinatorFactory.build({}, { associations: { personId: person.id } })
  })
}
