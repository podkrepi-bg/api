import { PrismaClient } from '@prisma/client'

import { donationWishFactory } from './factory'

const prisma = new PrismaClient()

const SEED_DONATION_WISHES = 25

export async function donationsWishesSeed() {
  console.log('Donation wishes seed')

  const person = await prisma.person.findFirst()
  if (!person) {
    throw new Error('There are no people created yet!')
  }

  const campaign = await prisma.campaign.findFirst()
  if (!campaign) {
    throw new Error('There are no vaults created yet!')
  }

  const donationWishesData = donationWishFactory.buildList(
    SEED_DONATION_WISHES,
    {},
    {
      associations: {
        campaignId: campaign.id,
        personId: person.id,
      },
    },
  )

  const insertDonationWishes = await prisma.donationWish.createMany({
    data: donationWishesData,
    skipDuplicates: true,
  })

  console.log({ insertDonationWishes })
}
