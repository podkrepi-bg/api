import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function coordinatorSeed() {
  console.log('Coordinators seed')

  const persons = await prisma.person.findMany({ where: { newsletter: true } })
  console.log(persons)

  if (!persons) {
    throw new Error('No persons subscribed to newsletter')
  }

  const result = persons.map((p) => {
    return { personId: p.id }
  })

  const insert = await prisma.coordinator.createMany({
    data: result,
    skipDuplicates: true,
  })
  console.log({ insert })
}
