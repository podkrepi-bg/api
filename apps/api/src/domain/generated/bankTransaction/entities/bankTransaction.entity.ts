
import {Currency,BankTransactionType,BankDonationStatus} from '@prisma/client'


export class BankTransaction {
  id: string ;
ibanNumber: string ;
bankName: string ;
bankIdCode: string ;
transactionDate: Date ;
senderName: string  | null;
recipientName: string  | null;
senderIban: string  | null;
recipientIban: string  | null;
amount: number ;
currency: Currency ;
description: string ;
matchedRef: string  | null;
type: BankTransactionType ;
bankDonationStatus: BankDonationStatus  | null;
notified: boolean  | null;
}
