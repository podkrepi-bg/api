import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker'
const prisma = new PrismaClient()

export async function bankAccountSeed() {
  console.log('Bank Accounts Seed')

  const insert = await prisma.bankAccount.createMany({
    data: [
      {
        accountHolderName: faker.name.firstName() + ' ' + faker.name.lastName(),
        accountHolderType: 'individual',
        bankIdCode: 'STSABGSF',
        ibanNumber: 'BG18RZBB91550123456789',
        bankName: 'OBB',
        fingerprint: 'something',
        status: 'validated',
      },
      {
        accountHolderName: faker.name.firstName() + ' ' + faker.name.lastName(),
        accountHolderType: 'company',
        bankIdCode: 'BGUSBGSF',
        ibanNumber: 'BG99RZBB91250123456735',
        bankName: 'Tokuda Bank',
        fingerprint: 'other',
        status: 'validated',
      },
      {
        accountHolderName: faker.name.firstName() + ' ' + faker.name.lastName(),
        accountHolderType: 'individual',
        bankIdCode: 'VPAYBGS2',
        ibanNumber: 'BG22RZBB81550123456721',
        bankName: 'ReiffeisenBank',
        fingerprint: 'example',
        status: 'errored',
      },
    ],
    skipDuplicates: true,
  })
  console.log({ insert })
}
