import { PrismaClient, PersonRelation } from '@prisma/client'
const prisma = new PrismaClient()

export async function beneficiarySeed() {
  console.log('Beneficiary seed')

  const persons = await prisma.person.findMany()
  console.log(persons)

  if (!persons) {
    throw new Error('No persons subscribed to newsletter')
  }

  const bg = await prisma.country.findFirst({ where: { countryCode: 'BG' } })
  console.log(bg)

  if (!bg) {
    throw new Error('No country BG')
  }

  const cityFromDb = await prisma.city.findFirst({ where: { countryId: bg.id} })
  console.log(cityFromDb)

  if (!cityFromDb) {
    throw new Error('No city')
  }

  const coordinatorFromDb = await prisma.coordinator.findFirst()
  console.log(coordinatorFromDb)

  if (!coordinatorFromDb) {
    throw new Error('No coordinator')
  }

  var result = [];
  persons.map(p => {result.push( { type: "individual", personId: p.id, countryCode: bg.countryCode, cityId: cityFromDb.id, details: {}, coordinatorId: coordinatorFromDb.id, coordinatorRelation: PersonRelation.none });})

  console.log(result);

  const insert = await prisma.beneficiary.createMany({
    data: result,
    skipDuplicates: true,
  })
  console.log({ insert })
}
