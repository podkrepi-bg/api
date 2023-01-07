import { PrismaClient } from '@prisma/client'

import { countryBulgaria } from './data'
import { Country } from '.prisma/client'

const prisma = new PrismaClient()

export async function countriesSeed() {
  console.log('Countries seed')

  const defaultCountriesData: Country[] = [countryBulgaria]
  const insertCountries = await prisma.country.createMany({
    data: defaultCountriesData,
    skipDuplicates: true,
  })

  console.log({ insertCountries })
}
