import { Vault } from '@prisma/client'
import { randomUUID } from 'crypto'

export const mockVault: Vault = {
  id: randomUUID(),
  currency: 'BGN',
  createdAt: new Date(),
  updatedAt: new Date(),
  amount: 100,
  blockedAmount: 0,
  campaignId: 'campaign-id',
  name: 'Test vault',
}
