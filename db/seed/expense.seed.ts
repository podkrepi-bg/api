import faker from 'faker'
import { Currency, ExpenseStatus, ExpenseType, PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function expenseSeed() {
  console.log('Expense seed')

  const vault = await prisma.vault.findFirst()

  if (!vault) {
    throw new Error('There are no vaults created yet!')
  }

  const insert = await prisma.expense.createMany({
    data: [
      {
        currency: Currency.BGN,
        type: ExpenseType.legal,
        amount: faker.datatype.number({ min: 1, max: 1000 }),
        description: faker.lorem.words(10),
        status: ExpenseStatus.pending,
        vaultId: vault.id,
      },
      {
        currency: Currency.BGN,
        type: ExpenseType.advertising,
        amount: faker.datatype.number({ min: 1, max: 1000 }),
        description: faker.lorem.words(10),
        status: ExpenseStatus.approved,
        vaultId: vault.id,
      },
      {
        currency: Currency.BGN,
        type: ExpenseType.rental,
        amount: faker.datatype.number({ min: 1, max: 1000 }),
        description: faker.lorem.words(10),
        status: ExpenseStatus.canceled,
        vaultId: vault.id,
      },
      {
        currency: Currency.BGN,
        type: ExpenseType.administrative,
        amount: faker.datatype.number({ min: 1, max: 1000 }),
        description: faker.lorem.words(10),
        status: ExpenseStatus.deleted,
        vaultId: vault.id,
      },
      {
        currency: Currency.BGN,
        type: ExpenseType.bank,
        amount: faker.datatype.number({ min: 1, max: 1000 }),
        description: faker.lorem.words(10),
        status: ExpenseStatus.pending,
        vaultId: vault.id,
      },
      {
        currency: Currency.BGN,
        type: ExpenseType.internal,
        amount: faker.datatype.number({ min: 1, max: 1000 }),
        description: faker.lorem.words(10),
        status: ExpenseStatus.pending,
        vaultId: vault.id,
      },
      {
        currency: Currency.BGN,
        type: ExpenseType.shipping,
        amount: faker.datatype.number({ min: 1, max: 1000 }),
        description: faker.lorem.words(10),
        status: ExpenseStatus.pending,
        vaultId: vault.id,
      },
      {
        currency: Currency.BGN,
        type: ExpenseType.transport,
        amount: faker.datatype.number({ min: 1, max: 1000 }),
        description: faker.lorem.words(10),
        status: ExpenseStatus.pending,
        vaultId: vault.id,
      },
      {
        currency: Currency.BGN,
        type: ExpenseType.shipping,
        amount: faker.datatype.number({ min: 1, max: 1000 }),
        description: faker.lorem.words(10),
        status: ExpenseStatus.pending,
        vaultId: vault.id,
      },
      {
        currency: Currency.BGN,
        type: ExpenseType.services,
        amount: faker.datatype.number({ min: 1, max: 1000 }),
        description: faker.lorem.words(10),
        status: ExpenseStatus.pending,
        vaultId: vault.id,
      },
    ],
    skipDuplicates: true,
  })
  console.log({ insert })
}
