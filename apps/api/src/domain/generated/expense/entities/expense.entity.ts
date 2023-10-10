
import {ExpenseType,Currency,ExpenseStatus} from '@prisma/client'
import {Person} from '../../person/entities/person.entity'
import {Document} from '../../document/entities/document.entity'
import {Vault} from '../../vault/entities/vault.entity'
import {ExpenseFile} from '../../expenseFile/entities/expenseFile.entity'


export class Expense {
  id: string ;
type: ExpenseType ;
description: string  | null;
vaultId: string ;
documentId: string  | null;
approvedById: string  | null;
amount: number ;
currency: Currency ;
status: ExpenseStatus ;
deleted: boolean ;
approvedBy?: Person  | null;
document?: Document  | null;
vault?: Vault ;
spentAt: Date ;
expenseFiles?: ExpenseFile[] ;
}
