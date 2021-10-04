import { ExpenseType } from '@prisma/client'
import { Vault } from '../../vault/entities/vault.entity'
import { Person } from '../../person/entities/person.entity'
import { Document } from '../../document/entities/document.entity'

export class Expense {
  id: string
  type: ExpenseType
  description: string | null
  vaultId: string
  documentId: string | null
  approvedById: string | null
  vault?: Vault
  approvedBy?: Person | null
  document?: Document | null
}
