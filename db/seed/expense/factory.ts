import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'

import { Expense } from '.prisma/client'
import { Currency, ExpenseStatus, ExpenseType } from '@prisma/client'

export const expenseFactory = Factory.define<Expense>(({ associations }) => ({
  id: faker.datatype.uuid(),
  type: faker.helpers.arrayElement(Object.values(ExpenseType)),
  description: faker.lorem.lines(1),
  vaultId: associations.vaultId || faker.datatype.uuid(),
  documentId: associations.documentId || null,
  approvedById: associations.approvedById || null,
  amount: faker.datatype.number(),
  currency: faker.helpers.arrayElement(Object.values(Currency)),
  status: faker.helpers.arrayElement(Object.values(ExpenseStatus)),
  deleted: faker.datatype.boolean(),
}))
