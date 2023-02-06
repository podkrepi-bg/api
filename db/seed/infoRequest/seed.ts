import { faker } from '@faker-js/faker'
import { PrismaClient } from '@prisma/client'

import { InfoRequest } from '@prisma/client'
import { infoRequestFactory } from './factory'

const prisma = new PrismaClient()

export async function infoRequestSeed() {
  console.log('Info requests seed')

  const randomInfoRequestsData: InfoRequest[] = await buildRandomInfoRequests()
  const insertInfoRequests = await prisma.infoRequest.createMany({
    data: randomInfoRequestsData,
    skipDuplicates: true,
  })

  console.log({ insertInfoRequests })
}

async function buildRandomInfoRequests(): Promise<InfoRequest[]> {
  const persons = await prisma.person.findMany({ where: { newsletter: true } })

  return persons.map((person) => {
    return infoRequestFactory.build({}, { associations: { personId: person.id } })
  })
}
