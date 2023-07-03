import { Campaign, CampaignNewsState, Person, PrismaClient } from '@prisma/client'
import { campaignNewsFactory } from './factory'

const prisma = new PrismaClient()

const SEED_PUBLISHED_NEWS = 5
const SEED_DRAFT_NEWS = 5

interface SeedData {
  campaign: Campaign
  person: Person
}

export async function campaignNewsSeed() {
  console.log(`Campaign news seed`)

  const campaign = await prisma.campaign.findFirst()
  const person = await prisma.person.findFirst({ where: { email: 'admin@podkrepi.bg' } })

  if (!campaign) {
    throw new Error('Campaign not found')
  }

  if (!person?.keycloakId) {
    throw new Error('Person not found')
  }

  await seedDraftNews({ campaign: campaign, person: person })
  await seedPublishedNews({ campaign: campaign, person: person })
}

async function seedPublishedNews({ campaign, person }: SeedData) {
  const campaignNewsData = campaignNewsFactory.buildList(
    SEED_PUBLISHED_NEWS,
    {
      state: CampaignNewsState.published,
      editedAt: undefined,
    },
    {
      associations: {
        publisherId: person.id,
        campaignId: campaign.id,
      },
    },
  )

  const insertPublishedNews = await prisma.campaignNews.createMany({
    data: campaignNewsData,
    skipDuplicates: true,
  })

  console.log({ insertPublishedNews })
}

async function seedDraftNews({ campaign, person }: SeedData) {
  const campaignNewsData = campaignNewsFactory.buildList(
    SEED_DRAFT_NEWS,
    {
      state: CampaignNewsState.draft,
      publishedAt: undefined,
    },
    {
      associations: {
        publisherId: person.id,
        campaignId: campaign.id,
      },
    },
  )

  const insertDraftNews = await prisma.campaignNews.createMany({
    data: campaignNewsData,
    skipDuplicates: true,
  })

  console.log({ insertDraftNews })
}
