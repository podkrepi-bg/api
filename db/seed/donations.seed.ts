import { CampaignState, Currency, PrismaClient } from '@prisma/client'
import faker from 'faker'
const prisma = new PrismaClient()

export async function donationsSeed() {
  console.log('Donations seed')

  const person = await prisma.person.findFirst()
  const campaign = await prisma.campaign.findFirst()
  const vault = await prisma.vault.findFirst()

  if (!campaign) {
    throw new Error('There are no vaults created yet!')
  }
  if (!vault) {
    throw new Error('There are no vaults created yet!')
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
      },
    ],
    skipDuplicates: true,
  })
  console.log({ insert })
}
