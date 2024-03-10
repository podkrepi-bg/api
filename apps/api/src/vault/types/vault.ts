import { Prisma } from '@prisma/client'

export type VaultUpdate = {
  [key: string]: number
}

export type VaultWithWithdrawalSum = Prisma.VaultGetPayload<{
  include: { campaign: { select: { id: true; title: true } } }
}> & {
  withdrawnAmount: number
}
