
import {BankTransactionType,BankDonationStatus} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'




export class CreateBankTransactionDto {
  id: string;
ibanNumber: string;
bankName: string;
bankIdCode: string;
transactionDate: Date;
senderName?: string;
recipientName?: string;
senderIban?: string;
recipientIban?: string;
description: string;
matchedRef?: string;
@ApiProperty({ enum: BankTransactionType})
type: BankTransactionType;
@ApiProperty({ enum: BankDonationStatus})
bankDonationStatus?: BankDonationStatus;
notified?: boolean;
}
