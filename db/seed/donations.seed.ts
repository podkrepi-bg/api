import {
  CampaignState,
  Currency,
  PrismaClient,
  PaymentProvider,
  DonationStatus,
  DonationType,
} from '@prisma/client'
import { faker } from '@faker-js/faker'
const prisma = new PrismaClient()

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

export async function donationsSeed() {
  console.log('Donations seed')

  const person = await prisma.person.findFirst()
  const campaign = await prisma.campaign.findFirst()
  const vault = await prisma.vault.findFirst()

  const completedCampaignVault = await prisma.vault.findFirst({
    where: {
      name: {
        contains: 'completed',
      },
    },
  })

  const heavilyFundedCampaignVault = await prisma.vault.findFirst({
    where: {
      name: {
        contains: 'heavily-funded',
      },
    },
  })

  if (!campaign) {
    throw new Error('There are no vaults created yet!')
  }
  if (!vault) {
    throw new Error('There are no vaults created yet!')
  }

  if (!completedCampaignVault) {
    throw new Error('There is no vault for the completed campaign')
  }

  if (!heavilyFundedCampaignVault) {
    throw new Error('There is no vault for the heavily funded campaign')
  }

  const insert = await prisma.donation.createMany({
    data: [
      {
        type: 'donation',
        amount: parseInt(faker.finance.amount(2000, 20000)),
        currency: 'BGN',
        personId: person?.id ?? undefined,
        targetVaultId: vault.id,
        extCustomerId: 'cus_' + faker.random.alphaNumeric(8),
        extPaymentIntentId: 'pi_' + faker.random.alphaNumeric(8),
        extPaymentMethodId: 'pm_' + faker.random.alphaNumeric(8),
        provider: PaymentProvider.stripe,
        status: DonationStatus.succeeded,
      },
      {
        type: 'donation',
        amount: parseInt(faker.finance.amount(2000, 20000)),
        currency: 'BGN',
        personId: person?.id ?? undefined,
        targetVaultId: vault.id,
        extCustomerId: 'cus_' + faker.random.alphaNumeric(8),
        extPaymentIntentId: 'pi_' + faker.random.alphaNumeric(8),
        extPaymentMethodId: 'pm_' + faker.random.alphaNumeric(8),
        provider: PaymentProvider.bank,
        status: DonationStatus.initial,
      },
      {
        type: 'donation',
        amount: parseInt(faker.finance.amount(2000, 20000)),
        currency: 'BGN',
        personId: person?.id ?? undefined,
        targetVaultId: vault.id,
        extCustomerId: 'cus_' + faker.random.alphaNumeric(8),
        extPaymentIntentId: 'pi_' + faker.random.alphaNumeric(8),
        extPaymentMethodId: 'pm_' + faker.random.alphaNumeric(8),
        provider: PaymentProvider.stripe,
        status: DonationStatus.declined,
      },
    ],
    skipDuplicates: true,
  })
  console.log({ insert })

  console.log('Updating first campaign vault')
  await updateVault(vault.id)

  console.log('Insert 3 donations for the completed campaign')
  const donationsForCompletedCampaign = await prisma.donation.createMany({
    data: [...Array(3).keys()].map(() => {
      return {
        type: DonationType.donation,
        amount: parseInt(faker.finance.amount(10000, 20000)),
        currency: Currency.BGN,
        personId: person?.id ?? undefined,
        targetVaultId: completedCampaignVault.id,
        extCustomerId: 'cus_' + faker.random.alphaNumeric(8),
        extPaymentIntentId: 'pi_' + faker.random.alphaNumeric(8),
        extPaymentMethodId: 'pm_' + faker.random.alphaNumeric(8),
        provider: PaymentProvider.stripe,
        status: DonationStatus.succeeded,
      }
    }),
    skipDuplicates: true,
  })
  console.log({ donationsForCompletedCampaign })

  console.log('Updating completed campaign vault')
  await updateVault(completedCampaignVault.id)

  console.log('Insert 25 donations for the heavily funded campaign')
  const donationsForHeavilyFundedCampaign = await prisma.donation.createMany({
    data: [...Array(25).keys()].map(() => {
      return {
        type: DonationType.donation,
        amount: parseInt(faker.finance.amount(100, 1000)),
        currency: Currency.BGN,
        personId: person?.id ?? undefined,
        targetVaultId: heavilyFundedCampaignVault.id,
        extCustomerId: 'cus_' + faker.random.alphaNumeric(8),
        extPaymentIntentId: 'pi_' + faker.random.alphaNumeric(8),
        extPaymentMethodId: 'pm_' + faker.random.alphaNumeric(8),
        provider: PaymentProvider.stripe,
        status: DonationStatus.succeeded,
      }
    }),
    skipDuplicates: true,
  })
  console.log({ donationsForHeavilyFundedCampaign })

  console.log('Updating heavily funded campaign vault')
  await updateVault(heavilyFundedCampaignVault.id)
}
