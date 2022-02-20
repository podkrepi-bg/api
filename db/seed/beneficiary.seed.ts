import { PrismaClient, PersonRelation, BeneficiaryType } from '@prisma/client'
const prisma = new PrismaClient()

export async function beneficiarySeed() {
  console.log('Beneficiary seed')

  const persons = await prisma.person.findMany()
  if (!persons) {
    throw new Error('No persons subscribed to newsletter')
  }

  const bg = await prisma.country.findFirst({ where: { countryCode: 'BG' } })
  if (!bg) {
    throw new Error('No country BG')
  }

  const cityFromDb = await prisma.city.findFirst({ where: { countryId: bg.id } })
  if (!cityFromDb) {
    throw new Error('No city')
  }

  const coordinatorFromDb = await prisma.coordinator.findFirst()
  if (!coordinatorFromDb) {
    throw new Error('No coordinator')
  }

  const insert = await prisma.beneficiary.createMany({
    data: persons.map((person) => ({
      type: BeneficiaryType.individual,
      personId: person.id,
      countryCode: bg.countryCode,
      cityId: cityFromDb.id,
      coordinatorId: coordinatorFromDb.id,
      coordinatorRelation: PersonRelation.none,
    })),
    skipDuplicates: true,
  })
  console.log({ insert })
}
