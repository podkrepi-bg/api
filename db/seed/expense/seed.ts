import { Expense, PrismaClient } from '@prisma/client'
import { expenseFactory } from './factory'

const prisma = new PrismaClient()

export async function expenseSeed() {
  console.log('Expense seed')

  const vault = await prisma.vault.findFirst()

  if (!vault) {
    throw new Error('There are no vaults created yet!')
  }

  const expensesData: Expense[] = expenseFactory.buildList(
    20,
    {},
    {
      associations: {
        vaultId: vault.id,
      },
    },
  )
  const insertExpenses = await prisma.expense.createMany({
    data: expensesData,
    skipDuplicates: true,
  })

  console.log({ insertExpenses })
}
