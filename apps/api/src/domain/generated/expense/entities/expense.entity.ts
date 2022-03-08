
import {ExpenseType,ExpenseStatus,Currency} from '@prisma/client'
import {Vault} from '../../vault/entities/vault.entity'
import {Person} from '../../person/entities/person.entity'
import {Document} from '../../document/entities/document.entity'


export class Expense {
  id: string ;
type: ExpenseType ;
status: ExpenseStatus ;
currency: Currency ;
amount: number ;
vaultId: string ;
deleted: boolean ;
description: string  | null;
documentId: string  | null;
approvedById: string  | null;
vault?: Vault ;
approvedBy?: Person  | null;
document?: Document  | null;
}
