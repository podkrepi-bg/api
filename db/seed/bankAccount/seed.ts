import { BankAccount, PrismaClient } from '@prisma/client'
import { bankAccountOBB, bankAccountReiffeisen, bankAccountTokuda } from './data'

const prisma = new PrismaClient()

export async function bankAccountSeed() {
  console.log('Bank Accounts Seed')

  const defaultBankAccountsData: BankAccount[] = [
    bankAccountOBB,
    bankAccountTokuda,
    bankAccountReiffeisen,
  ]

  const insertBankAccounts = await prisma.bankAccount.createMany({
    data: defaultBankAccountsData,
    skipDuplicates: true,
  })

  console.log({ insertBankAccounts })
}
