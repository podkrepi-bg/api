import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function campaignTypesSeed() {
  console.log('CampaignTypes seed')

  const treatment = await prisma.campaignType.upsert({
    where: { slug: 'treatment-and-rehabilitation' },
    update: {},
    create: {
      name: 'Treatment and rehabilitation',
      slug: 'treatment-and-rehabilitation',
      category: 'medical',
    },
  })
  const helping = await prisma.campaignType.upsert({
    where: { slug: 'helping-the-needy' },
    update: {},
    create: { name: 'Helping the needy', slug: 'helping-the-needy', category: 'charity' },
  })
  const society = await prisma.campaignType.upsert({
    where: { slug: 'better-society' },
    update: {},
    create: { name: 'Better society', slug: 'better-society', category: 'others' },
  })

  const campaignTypes = await prisma.campaignType.createMany({
    data: [
      // Treatment and rehabilitation
      {
        name: 'Transplantation',
        slug: 'transplantation',
        parentId: treatment.id,
        category: 'medical',
      },
      { name: 'Cancer', slug: 'cancer', parentId: treatment.id, category: 'medical' },
      { name: 'Leukemia', slug: 'leukemia', parentId: treatment.id, category: 'medical' },
      {
        name: 'Genetic diseases',
        slug: 'genetic-diseases',
        parentId: treatment.id,
        category: 'medical',
      },
      {
        name: 'Rehabilitation',
        slug: 'rehabilitation',
        parentId: treatment.id,
        category: 'medical',
      },
      // Helping the needy
      { name: 'Kids in risk', slug: 'kids-in-risk', parentId: helping.id, category: 'charity' },
      { name: 'Third age', slug: 'third-age', parentId: helping.id, category: 'charity' },
      {
        name: 'Homes for children',
        slug: 'homes-for-children',
        parentId: helping.id,
        category: 'charity',
      },
      { name: 'Nursing homes', slug: 'nursing-homes', parentId: helping.id, category: 'medical' },
      // Better society
      { name: 'Education', slug: 'education', parentId: society.id, category: 'education' },
      { name: 'Culture', slug: 'culture', parentId: society.id, category: 'others' },
      { name: 'Nature', slug: 'nature', parentId: society.id, category: 'nature' },
      { name: 'Human rights', slug: 'human-rights', parentId: society.id, category: 'others' },
      { name: 'Animals', slug: 'animals', parentId: society.id, category: 'animals' },
      { name: 'Disasters', slug: 'disasters', parentId: society.id, category: 'disasters' },
    ],
    skipDuplicates: true,
  })
  console.log({ campaignTypes })
}
