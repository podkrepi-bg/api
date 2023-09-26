import { Expense, PrismaClient } from '@prisma/client'
import { expenseFactory } from './factory'

const prisma = new PrismaClient()

export async function expenseSeed() {
  console.log('Expense seed')

  const vault = await prisma.vault.findFirst({
    where: {
      campaign: {
        title: {
          contains: 'heavily-funded',
        },
      },
    },
  })

  if (!vault) {
    throw new Error('There are no vaults created yet!')
  }

  const coordinator = await prisma.coordinator.findFirst()

  if (!coordinator) {
    throw new Error('There are no coordinators created yet!')
  }

  const expensesData: Expense[] = expenseFactory.buildList(
    11,
    {},
    {
      associations: {
        vaultId: vault.id,
        approvedById: coordinator.personId,
      },
    },
  )
  const insertExpenses = await prisma.expense.createMany({
    data: expensesData,
    skipDuplicates: true,
  })

  console.log({ insertExpenses })
}
