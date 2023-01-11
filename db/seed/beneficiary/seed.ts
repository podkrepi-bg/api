import {
  Beneficiary,
  BeneficiaryType,
  City,
  Company,
  Coordinator,
  Country,
  Person,
  Prisma,
  PrismaClient,
} from '@prisma/client'
import { beneficiaryFactory } from './factory'

const prisma = new PrismaClient()

interface SeedData {
  country: Country
  city: City
  coordinator: Coordinator
}

export async function beneficiarySeed() {
  console.log('Beneficiary seed')

  const countryBg = await prisma.country.findFirst({ where: { countryCode: 'BG' } })
  if (!countryBg) {
    throw new Error('No country BG')
  }

  const cityFromDb = await prisma.city.findFirst({ where: { countryId: countryBg.id } })
  if (!cityFromDb) {
    throw new Error('No city')
  }

  const coordinatorFromDb = await prisma.coordinator.findFirst()
  if (!coordinatorFromDb) {
    throw new Error('No coordinator')
  }

  await seedPeopleBeneficiaries({
    country: countryBg,
    city: cityFromDb,
    coordinator: coordinatorFromDb,
  })

  await seedCompaniesBeneficiaries({
    country: countryBg,
    city: cityFromDb,
    coordinator: coordinatorFromDb,
  })
}

async function seedPeopleBeneficiaries({ country, city, coordinator }: SeedData) {
  const persons: Person[] = await prisma.person.findMany()
  if (!persons) {
    throw new Error('No persons in the database')
  }

  const randomPeopleBeneficiariesData: Beneficiary[] = persons
    .slice(0, persons.length / 2)
    .map((person) => {
      return beneficiaryFactory.build(
        {
          type: BeneficiaryType.individual,
          countryCode: country.countryCode,
        },
        {
          associations: {
            personId: person.id,
            cityId: city.id,
            coordinatorId: coordinator.id,
          },
        },
      )
    })

  const insertPeopleAsBeneficiaries = await prisma.beneficiary.createMany({
    data: randomPeopleBeneficiariesData.map(removeJsonFields),
    skipDuplicates: true,
  })

  console.log({ insertPeopleAsBeneficiaries })
}

async function seedCompaniesBeneficiaries({ country, city, coordinator }: SeedData) {
  const companies: Company[] = await prisma.company.findMany()
  if (!companies) {
    throw new Error('No companies in the database')
  }

  const randomCompaniesBeneficiariesData: Beneficiary[] = companies
    .slice(0, companies.length / 2)
    .map((company) => {
      return beneficiaryFactory.build(
        {
          type: BeneficiaryType.company,
          countryCode: country.countryCode,
        },
        {
          associations: {
            companyId: company.id,
            cityId: city.id,
            coordinatorId: coordinator.id,
          },
        },
      )
    })

  const insertCompaniesAsBeneficiaries = await prisma.beneficiary.createMany({
    data: randomCompaniesBeneficiariesData.map(removeJsonFields),
    skipDuplicates: true,
  })

  console.log({ insertCompaniesAsBeneficiaries })
}

// Note: For some reason "prisma.createMany" method doesn't accept NULL values for the JSON fields,
// so we need to do this stupid mapping and exclude those fields
function removeJsonFields(beneficiary: Beneficiary): Prisma.BeneficiaryCreateManyInput {
  return {
    ...beneficiary,
    privateData: undefined,
    publicData: undefined,
  }
}
