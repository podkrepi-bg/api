import { PrismaClient } from '@prisma/client'

import { Person } from '@prisma/client'
import { personFactory } from './factory'
import { adminUser, coordinatorUser, giverUser, receiverUser, reviewerUser } from './data'

const prisma = new PrismaClient()

export async function personSeed() {
  console.log('Persons seed')

  await seedDefaultUsers()
  await seedRandomUsers()
}

async function seedDefaultUsers() {
  const defaultUsersData: Person[] = [
    adminUser,
    coordinatorUser,
    giverUser,
    receiverUser,
    reviewerUser,
  ]

  const insertDefaultUsers = await prisma.person.createMany({
    data: defaultUsersData,
    skipDuplicates: true,
  })
  console.log({ insertDefaultUsers })
}

async function seedRandomUsers() {
  const randomUsersData: Person[] = personFactory.buildList(10)

  const insertRandomUsers = await prisma.person.createMany({
    data: randomUsersData,
    skipDuplicates: true,
  })
  console.log({ insertRandomUsers })
}
