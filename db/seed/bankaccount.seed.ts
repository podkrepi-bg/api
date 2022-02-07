import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function bankAccountsSeed() {
  console.log('Cities seed')

  const insert = await prisma.bankAccount.createMany({
    data: [
      {
        accountHolderName: 'Georgi Pavlov',
        accountHolderType: 'individual',
        bankIdCode: 'STSABGSF',
        ibanNumber: 'BG18RZBB91550123456789',
        bankName: 'OBB',
        fingerprint: 'something',
        status: 'validated',
      },
      {
        accountHolderName: 'Hristo Stoyanov',
        accountHolderType: 'company',
        bankIdCode: 'BGUSBGSF',
        ibanNumber: 'BG99RZBB91250123456735',
        bankName: 'Tokuda Bank',
        fingerprint: 'other',
        status: 'validated',
      },
      {
        accountHolderName: 'Iliq Markov',
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
