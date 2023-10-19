import { Currency } from '@prisma/client'
import { Expose, Type } from 'class-transformer'
import {
  IsEnum,
  IsIBAN,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'

class bankAccountDto {
  @IsString()
  @IsIBAN()
  @Expose()
  iban: string
}

class transactionAmountDto {
  @IsNumber()
  @Expose()
  amount: number

  @IsEnum(Currency)
  @Expose()
  currency: Currency
}

export class IrisTransactionInfoDto {
  @IsString()
  @Expose()
  transactionId: string

  @IsString()
  @Expose()
  bookingDate: string

  @IsObject()
  @Expose()
  @Type(() => bankAccountDto)
  @ValidateNested({ each: true })
  debtorAccount: bankAccountDto

  @IsObject()
  @Expose()
  @Type(() => bankAccountDto)
  @ValidateNested({ each: true })
  creditorAccount: bankAccountDto

  @IsOptional()
  @IsString()
  @Expose()
  creditorName: string | null

  @IsOptional()
  @IsString()
  @Expose()
  debtorName: string | null

  @IsString()
  @Expose()
  remittanceInformationUnstructured: string

  @IsObject()
  @Expose()
  @Type(() => transactionAmountDto)
  @ValidateNested({ each: true })
  transactionAmount: transactionAmountDto

  @IsOptional()
  @IsNumber()
  @Expose()
  exchangeRate: number | null

  @Expose()
  @IsString()
  valueDate: string

  @Expose()
  @IsString()
  creditDebitIndicator: 'DEBIT' | 'CREDIT'
}
