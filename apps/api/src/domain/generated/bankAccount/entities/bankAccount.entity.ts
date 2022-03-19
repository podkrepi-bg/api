
import {BankAccountStatus,AccountHolderType} from '@prisma/client'
import {Withdrawal} from '../../withdrawal/entities/withdrawal.entity'


export class BankAccount {
  id: string ;
status: BankAccountStatus ;
ibanNumber: string ;
accountHolderName: string ;
accountHolderType: AccountHolderType ;
bankName: string  | null;
bankIdCode: string  | null;
fingerprint: string  | null;
createdAt: Date ;
updatedAt: Date  | null;
withdraws?: Withdrawal[] ;
}
