import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'

import { Currency, PaymentStatus, PaymentProvider, PaymentType, Payment } from '@prisma/client'

export const paymentFactory = Factory.define<Payment>(({ associations }) => ({
  id: faker.datatype.uuid(),
  affiliateId: null,
  type: faker.helpers.arrayElement(Object.values(PaymentType)),
  status: faker.helpers.arrayElement(Object.values(PaymentStatus)),
  provider: faker.helpers.arrayElement(Object.values(PaymentProvider)),
  extCustomerId: 'cus_' + faker.random.alphaNumeric(8),
  extPaymentIntentId: 'pi_' + faker.random.alphaNumeric(8),
  extPaymentMethodId: 'pm_' + faker.random.alphaNumeric(8),
  currency: Currency.BGN,
  billingEmail: faker.internet.email(),
  billingName: faker.name.fullName(),
  amount: parseInt(faker.finance.amount(2000, 20000)),
  chargedAmount: 0, // Note: Verify what is the purpose of this field and maybe provide different initial value?
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
}))
