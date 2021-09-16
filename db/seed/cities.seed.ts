import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function citiesSeed() {
  console.log('Cities seed')

  const bg = await prisma.country.findFirst({ where: { countryCode: 'BG' } })
  console.log(bg)

  if (!bg) {
    throw new Error('No country BG')
  }

  const insert = await prisma.city.createMany({
    data: [
      { name: 'Sofia', postalCode: 1000, countryId: bg.id },
      { name: 'Plovdiv', postalCode: 4000, countryId: bg.id },
      { name: 'Varna', postalCode: 9000, countryId: bg.id },
    ],
    skipDuplicates: true,
  })
  console.log({ insert })
}
