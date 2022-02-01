
import {DocumentType} from '@prisma/client'
import {Person} from '../../person/entities/person.entity'
import {Expense} from '../../expense/entities/expense.entity'


export class Document {
  id: string ;
type: DocumentType ;
name: string ;
filename: string ;
filetype: string  | null;
description: string  | null;
sourceUrl: string ;
ownerId: string ;
owner?: Person ;
expenses?: Expense[] ;
}
