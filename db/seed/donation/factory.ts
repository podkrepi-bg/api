import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'

import { Donation } from '.prisma/client'
import { Currency, DonationStatus, DonationType, PaymentProvider } from '@prisma/client'

export const donationFactory = Factory.define<Donation>(({ associations }) => ({
  id: faker.datatype.uuid(),
  affiliateId: null,
  type: faker.helpers.arrayElement(Object.values(DonationType)),
  status: faker.helpers.arrayElement(Object.values(DonationStatus)),
  provider: faker.helpers.arrayElement(Object.values(PaymentProvider)),
  targetVaultId: associations.targetVaultId || faker.datatype.uuid(),
  extCustomerId: 'cus_' + faker.random.alphaNumeric(8),
  extPaymentIntentId: 'pi_' + faker.random.alphaNumeric(8),
  extPaymentMethodId: 'pm_' + faker.random.alphaNumeric(8),
  currency: Currency.BGN,
  personId: associations.personId || null,
  billingEmail: faker.internet.email(),
  billingName: faker.name.fullName(),
  amount: parseInt(faker.finance.amount(2000, 20000)),
  chargedAmount: 0, // Note: Verify what is the purpose of this field and maybe provide different initial value?
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
}))
