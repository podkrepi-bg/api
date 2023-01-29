import { BankAccount } from '@prisma/client'
import { AccountHolderType, BankAccountStatus } from '@prisma/client'
import { bankAccountFactory } from './factory'

/**
 * List with pre-defined default Bank Accounts
 */

export const bankAccountOBB: BankAccount = bankAccountFactory.build({
  bankName: 'OBB',
  bankIdCode: 'STSABGSF',
  ibanNumber: 'BG18RZBB91550123456789',
  accountHolderType: AccountHolderType.individual,
  status: BankAccountStatus.validated,
})

export const bankAccountTokuda: BankAccount = bankAccountFactory.build({
  bankName: 'Tokuda Bank',
  bankIdCode: 'BGUSBGSF',
  ibanNumber: 'BG99RZBB91250123456735',
  accountHolderType: AccountHolderType.company,
  status: BankAccountStatus.validated,
})

export const bankAccountReiffeisen: BankAccount = bankAccountFactory.build({
  bankName: 'ReiffeisenBank',
  bankIdCode: 'VPAYBGS2',
  ibanNumber: 'BG22RZBB81550123456721',
  accountHolderType: AccountHolderType.individual,
  status: BankAccountStatus.errored,
})
