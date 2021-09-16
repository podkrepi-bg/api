import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function campaignTypesSeed() {
  console.log('CampaignTypes seed')

  const treatment = await prisma.campaignType.upsert({
    where: { slug: 'treatment-and-rehabilitation' },
    update: {},
    create: { name: 'Treatment and rehabilitation', slug: 'treatment-and-rehabilitation' },
  })
  const helping = await prisma.campaignType.upsert({
    where: { slug: 'helping-the-needy' },
    update: {},
    create: { name: 'Helping the needy', slug: 'helping-the-needy' },
  })
  const society = await prisma.campaignType.upsert({
    where: { slug: 'better-society' },
    update: {},
    create: { name: 'Better society', slug: 'better-society' },
  })
  console.log({ treatment, helping, society })

  const campaignTypes = await prisma.campaignType.createMany({
    data: [
      // Treatment and rehabilitation
      { name: 'Transplantation', slug: 'transplantation', parentId: treatment.id },
      { name: 'Cancer', slug: 'cancer', parentId: treatment.id },
      { name: 'Leukemia', slug: 'leukemia', parentId: treatment.id },
      { name: 'Genetic diseases', slug: 'genetic-diseases', parentId: treatment.id },
      { name: 'Rehabilitation', slug: 'rehabilitation', parentId: treatment.id },
      // Helping the needy
      { name: 'Kids in risk', slug: 'kids-in-risk', parentId: helping.id },
      { name: 'Third age', slug: 'third-age', parentId: helping.id },
      { name: 'Homes for children', slug: 'homes-for-children', parentId: helping.id },
      { name: 'Nursing homes', slug: 'nursing-homes', parentId: helping.id },
      // Better society
      { name: 'Education', slug: 'education', parentId: society.id },
      { name: 'Culture', slug: 'culture', parentId: society.id },
      { name: 'Nature', slug: 'nature', parentId: society.id },
      { name: 'Human rights', slug: 'human-rights', parentId: society.id },
      { name: 'Animals', slug: 'animals', parentId: society.id },
      { name: 'Disasters', slug: 'disasters', parentId: society.id },
    ],
    skipDuplicates: true,
  })
  console.log({ campaignTypes })
}
