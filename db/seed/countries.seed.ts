import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function countriesSeed() {
  console.log('Countries seed')

  const insert = await prisma.country.createMany({
    data: [{ name: 'Bulgaria', countryCode: 'BG' }],
    skipDuplicates: true,
  })

  console.log({ insert })
}
