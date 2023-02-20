
import {Expense} from '../../expense/entities/expense.entity'
import {Person} from '../../person/entities/person.entity'


export class ExpenseFile {
  id: string ;
filename: string ;
mimetype: string ;
expenseId: string ;
uploaderId: string ;
expense?: Expense ;
uploadedBy?: Person ;
}
