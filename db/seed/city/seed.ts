import { PrismaClient } from '@prisma/client'

import { cityPlovdiv, citySofia, cityVarna } from './data'
import { City } from '.prisma/client'

const prisma = new PrismaClient()

export async function citiesSeed() {
  console.log('Cities seed')

  const countryBulgaria = await prisma.country.findFirst({ where: { countryCode: 'BG' } })
  if (!countryBulgaria) {
    throw new Error('No country BG')
  }

  const defaultCitiesData: City[] = [
    citySofia(countryBulgaria.id),
    cityPlovdiv(countryBulgaria.id),
    cityVarna(countryBulgaria.id),
  ]

  const insertCities = await prisma.city.createMany({
    data: defaultCitiesData,
    skipDuplicates: true,
  })
  console.log({ insertCities })
}
