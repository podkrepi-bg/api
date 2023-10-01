import {
  PrismaClient,
  PaymentProvider,
  DonationStatus,
  DonationType,
  Person,
  CampaignState,
} from '@prisma/client'

import { donationFactory } from './factory'

const prisma = new PrismaClient()

const SEED_COMPLETED_CAMPAIGN_DONATIONS = 5
const SEED_HEAVILY_FUNDED_CAMPAIGN_DONATIONS = 25

export async function donationsSeed() {
  console.log('Donations seed')

  const person = await prisma.person.findFirst()
  if (!person) {
    throw new Error('There are no people created yet!')
  }

  await seedRandomDonations({ person })
  await seedDonationsForCompletedCampaign({ person })
  await seedDonationsForHeavilyFundedCampaign({ person })
}

interface SeedData {
  person: Person
}

async function seedRandomDonations({ person }: SeedData) {
  const vault = await prisma.vault.findFirst()
  if (!vault) {
    throw new Error('There are no vaults created yet!')
  }

  const donationFactoryOptions = {
    associations: {
      personId: person.id,
      targetVaultId: vault.id,
    },
  }

  const randomDonationsData = [
    donationFactory.build(
      {
        type: DonationType.donation,
        provider: PaymentProvider.stripe,
        status: DonationStatus.succeeded,
      },
      donationFactoryOptions,
    ),
    donationFactory.build(
      {
        type: DonationType.donation,
        provider: PaymentProvider.stripe,
        status: DonationStatus.declined,
      },
      donationFactoryOptions,
    ),
    donationFactory.build(
      {
        type: DonationType.donation,
        provider: PaymentProvider.bank,
        status: DonationStatus.initial,
      },
      donationFactoryOptions,
    ),
  ]

  const insertRandomDonations = await prisma.donation.createMany({
    data: randomDonationsData,
    skipDuplicates: true,
  })

  console.log({ insertRandomDonations })

  console.log('{ Updating first campaign vault: %s }', vault.id)
  await updateVault(vault.id)
}

async function seedDonationsForCompletedCampaign({ person }: SeedData) {
  const completedCampaignVault = await prisma.vault.findFirst({
    where: {
      campaign: {
        state: CampaignState.complete,
      },
    },
  })

  if (!completedCampaignVault) {
    throw new Error('There is no vault for the completed campaign')
  }

  const donationFactoryOptions = {
    associations: {
      personId: person.id,
      targetVaultId: completedCampaignVault.id,
    },
  }

  const completedCampaignDonationsData = donationFactory.buildList(
    SEED_COMPLETED_CAMPAIGN_DONATIONS,
    {
      type: DonationType.donation,
      provider: PaymentProvider.stripe,
      status: DonationStatus.succeeded,
    },
    donationFactoryOptions,
  )

  const insertCompletedCampaignDonations = await prisma.donation.createMany({
    data: completedCampaignDonationsData,
    skipDuplicates: true,
  })

  console.log({ insertCompletedCampaignDonations })

  console.log('{ Updating completed campaign vault: %s }', completedCampaignVault.id)
  await updateVault(completedCampaignVault.id)
}

async function seedDonationsForHeavilyFundedCampaign({ person }: SeedData) {
  const heavilyFundedCampaignVault = await prisma.vault.findFirst({
    where: {
      campaign: {
        title: {
          contains: 'heavily-funded',
        },
      },
    },
  })

  if (!heavilyFundedCampaignVault) {
    throw new Error('There is no vault for the heavily funded campaign')
  }

  const donationFactoryOptions = {
    associations: {
      personId: person.id,
      targetVaultId: heavilyFundedCampaignVault.id,
    },
  }

  const heavilyFundedCampaignDonationsData = donationFactory.buildList(
    SEED_HEAVILY_FUNDED_CAMPAIGN_DONATIONS,
    {
      type: DonationType.donation,
      provider: PaymentProvider.stripe,
      status: DonationStatus.succeeded,
    },
    donationFactoryOptions,
  )

  const insertHeavilyFundedCampaignDonations = await prisma.donation.createMany({
    data: heavilyFundedCampaignDonationsData,
    skipDuplicates: true,
  })

  console.log({ insertHeavilyFundedCampaignDonations })

  console.log('{ Updating heavily-funded campaign vault: %s }', heavilyFundedCampaignVault.id)
  await updateVault(heavilyFundedCampaignVault.id)
}

/**
 * Update the vault after the donations have been created
 * The amount of the vault should represent the sum of the donations in it
 * @param vaultId
 */
async function updateVault(vaultId: string) {
  const totalDonationsAmount = await prisma.donation.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      targetVaultId: vaultId,
      status: DonationStatus.succeeded,
    },
  })

  await prisma.vault.update({
    where: {
      id: vaultId,
    },
    data: {
      amount: totalDonationsAmount._sum.amount || 0,
    },
  })
}
