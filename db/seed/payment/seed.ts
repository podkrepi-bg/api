import {
  PrismaClient,
  PaymentProvider,
  PaymentStatus,
  Person,
  CampaignState,
  PaymentType,
  DonationType,
} from '@prisma/client'

import { paymentFactory } from './factory'
import { faker } from '@faker-js/faker'
import { donationFactory } from '../donations/factory'

const prisma = new PrismaClient()

const SEED_COMPLETED_CAMPAIGN_DONATIONS = 5
const SEED_HEAVILY_FUNDED_CAMPAIGN_DONATIONS = 25

export async function paymentsSeed() {
  console.log('Payments seed')

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

  const randomPaymentsData = [
    paymentFactory.build({
      type: PaymentType.single,
      provider: PaymentProvider.stripe,
      status: PaymentStatus.succeeded,
    }),
    paymentFactory.build({
      type: PaymentType.single,
      provider: PaymentProvider.stripe,
      status: PaymentStatus.declined,
    }),
    paymentFactory.build({
      type: PaymentType.single,
      provider: PaymentProvider.bank,
      status: PaymentStatus.initial,
    }),
  ]

  const randomDonationsData = [
    donationFactory.build(
      {
        paymentId: randomPaymentsData[0].id,
        createdAt: randomPaymentsData[0].createdAt,
        updatedAt: randomPaymentsData[0].updatedAt,
      },
      donationFactoryOptions,
    ),
    donationFactory.build(
      {
        paymentId: randomPaymentsData[1].id,
        createdAt: randomPaymentsData[1].createdAt,
        updatedAt: randomPaymentsData[1].updatedAt,
      },
      donationFactoryOptions,
    ),
    donationFactory.build(
      {
        paymentId: randomPaymentsData[2].id,
        createdAt: randomPaymentsData[2].createdAt,
        updatedAt: randomPaymentsData[2].updatedAt,
      },
      donationFactoryOptions,
    ),
  ]
  const insertRandomPayments = await prisma.payment.createMany({
    data: randomPaymentsData,
    skipDuplicates: true,
  })

  const insertRandomDonations = await prisma.donation.createMany({
    data: randomDonationsData,
    skipDuplicates: true,
  })

  console.log({ insertRandomPayments })
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

  const completedCampaignPaymentsData = paymentFactory.buildList(
    SEED_COMPLETED_CAMPAIGN_DONATIONS,
    {
      type: PaymentType.single,
      provider: PaymentProvider.stripe,
      status: PaymentStatus.succeeded,
    },
  )

  const completedCampaignDonationData = completedCampaignPaymentsData.map((payment) =>
    donationFactory.build(
      { paymentId: payment.id, updatedAt: payment.updatedAt, createdAt: payment.createdAt },
      donationFactoryOptions,
    ),
  )

  const insertCompletedCampaignPayments = await prisma.payment.createMany({
    data: completedCampaignPaymentsData,
    skipDuplicates: true,
  })

  const insertCompletedCampaignDonations = await prisma.donation.createMany({
    data: completedCampaignDonationData,
    skipDuplicates: true,
  })

  console.log({ insertCompletedCampaignPayments })
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

  const heavilyFundedCampaignPaymentData = paymentFactory.buildList(
    SEED_HEAVILY_FUNDED_CAMPAIGN_DONATIONS,
    {
      type: PaymentType.single,
      provider: PaymentProvider.stripe,
      status: PaymentStatus.succeeded,
    },
  )
  const heavilyFundedCampaignDonationData = heavilyFundedCampaignPaymentData.map((payment) =>
    donationFactory.build(
      { paymentId: payment.id, createdAt: payment.createdAt, updatedAt: payment.updatedAt },
      donationFactoryOptions,
    ),
  )

  const insertHeavilyFundedCampaignPayments = await prisma.payment.createMany({
    data: heavilyFundedCampaignPaymentData,
    skipDuplicates: true,
  })
  const insertHeavilyFundedCampaignDonations = await prisma.donation.createMany({
    data: heavilyFundedCampaignDonationData,
    skipDuplicates: true,
  })
  console.log({ insertHeavilyFundedCampaignPayments })
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
  const totalDonationsAmount = await prisma.payment.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      donations: { some: { targetVaultId: vaultId } },
      status: PaymentStatus.succeeded,
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
