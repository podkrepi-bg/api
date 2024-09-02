import { PrismaClient } from '@prisma/client'

import { donationWishFactory } from './factory'

const prisma = new PrismaClient()

export async function donationsWishesSeed() {
  const campaigns = await prisma.campaign.findMany()
  if (!campaigns) {
    throw new Error('There are no campaigns created yet!')
  }

  const donation = await prisma.donation.findFirst()
  if (!donation) {
    throw new Error('There are no donations created yet!')
  }

  const person = await prisma.person.findFirst()
  if (!person) {
    throw new Error('There are no people created yet!')
  }
  const campaign = await prisma.campaign.findFirst({
    where: {
      vaults: {
        some: {
          id: donation.targetVaultId,
        },
      },
    },
  })
  if (!campaign) {
    throw new Error('There are no campaign with this vault created yet!')
  }
  const donationWishData = donationWishFactory.build({
    campaignId: campaign.id,
    personId: person.id,
    donationId: donation.id,
  })

  await prisma.donationWish.createMany({
    data: [donationWishData],
    skipDuplicates: true,
  })
}
