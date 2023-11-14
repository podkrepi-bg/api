import { ApiProperty } from '@nestjs/swagger'
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
  @ApiProperty()
  @IsString()
  @IsIBAN()
  @Expose()
  iban: string
}

class transactionAmountDto {
  @ApiProperty()
  @IsNumber()
  @Expose()
  amount: number

  @ApiProperty()
  @IsEnum(Currency)
  @Expose()
  currency: Currency
}

export class IrisTransactionInfoDto {
  @ApiProperty()
  @IsString()
  @Expose()
  transactionId: string

  @ApiProperty()
  @IsString()
  @Expose()
  bookingDate: string

  @ApiProperty()
  @IsObject()
  @Expose()
  @Type(() => bankAccountDto)
  @ValidateNested({ each: true })
  debtorAccount: bankAccountDto

  @ApiProperty()
  @IsObject()
  @Expose()
  @Type(() => bankAccountDto)
  @ValidateNested({ each: true })
  creditorAccount: bankAccountDto

  @ApiProperty()
  @IsOptional()
  @IsString()
  @Expose()
  creditorName: string | null

  @ApiProperty()
  @IsOptional()
  @IsString()
  @Expose()
  debtorName: string | null

  @ApiProperty()
  @IsString()
  @Expose()
  remittanceInformationUnstructured: string

  @ApiProperty()
  @IsObject()
  @Expose()
  @Type(() => transactionAmountDto)
  @ValidateNested({ each: true })
  transactionAmount: transactionAmountDto

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Expose()
  exchangeRate: number | null

  @ApiProperty()
  @Expose()
  @IsString()
  valueDate: string

  @ApiProperty()
  @Expose()
  @IsString()
  creditDebitIndicator: 'DEBIT' | 'CREDIT'
}
