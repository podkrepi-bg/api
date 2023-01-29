import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'

import { BankAccount } from '@prisma/client'
import { AccountHolderType, BankAccountStatus } from '@prisma/client'

export const bankAccountFactory = Factory.define<BankAccount>(() => ({
  id: faker.datatype.uuid(),
  status: faker.helpers.arrayElement(Object.values(BankAccountStatus)),
  ibanNumber: faker.finance.iban(),
  accountHolderName: faker.name.fullName(),
  accountHolderType: faker.helpers.arrayElement(Object.values(AccountHolderType)),
  bankName: faker.company.name(),
  bankIdCode: faker.finance.bic(),
  fingerprint: 'other',
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
}))
