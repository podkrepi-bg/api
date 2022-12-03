import { BeneficiaryType, PersonRelation, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function beneficiarySeed() {
  console.log('Beneficiary seed')

  const persons = await prisma.person.findMany()
  if (!persons) {
    throw new Error('No persons in the database')
  }

  const companies = await prisma.company.findMany()
  if (!companies) {
    throw new Error('No companies in the database')
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

  const insertPeopleAsBeneficiares = await prisma.beneficiary.createMany({
    data: persons.slice(0, persons.length / 2).map((person) => ({
      type: BeneficiaryType.individual,
      personId: person.id,
      countryCode: bg.countryCode,
      cityId: cityFromDb.id,
      coordinatorId: coordinatorFromDb.id,
      coordinatorRelation: PersonRelation.none,
    })),
    skipDuplicates: true,
  })
  const insertCompaniesAsBeneficiaries = await prisma.beneficiary.createMany({
    data: companies.slice(0, companies.length / 2).map((company) => ({
      type: BeneficiaryType.company,
      companyId: company.id,
      countryCode: bg.countryCode,
      cityId: cityFromDb.id,
      coordinatorId: coordinatorFromDb.id,
      coordinatorRelation: PersonRelation.none,
    })),
    skipDuplicates: true,
  })
  console.log({ insertPeopleAsBeneficiares, insertCompaniesAsBeneficiaries })
}
