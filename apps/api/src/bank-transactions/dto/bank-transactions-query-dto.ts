import { ApiProperty } from '@nestjs/swagger'
import { BankDonationStatus, BankTransactionType } from '@prisma/client'
import { Expose, Transform } from 'class-transformer'
import { IsOptional, IsString } from 'class-validator'

interface ToNumberOptions {
  min?: number
  max?: number
}

export class BankTransactionsQueryDto {
  @Expose()
  @IsOptional()
  @Transform(({ value }) => falsyToUndefined(value))
  status?: BankDonationStatus

  @Expose()
  @IsOptional()
  @Transform(({ value }) => falsyToUndefined(value))
  type?: BankTransactionType

  @Expose()
  @IsOptional()
  @Transform(({ value }) => handleDateTransform(value))
  from?: Date

  @Expose()
  @IsOptional()
  @Transform(({ value }) => handleDateTransform(value))
  to?: Date

  @Expose()
  @IsOptional()
  @Transform(({ value }) => falsyToUndefined(value))
  search?: string

  @Expose()
  @IsOptional()
  @Transform(({ value }) => toNumber(value))
  pageindex?: number

  @Expose()
  @IsOptional()
  @Transform(({ value }) => toNumber(value))
  pagesize?: number
}

function toNumber(value: string, opts: ToNumberOptions = {}): number | undefined {
  if (Number.isNaN(value)) {
    return undefined
  }
  if (opts.min || opts.max) {
    // TODO: figure out how to trigger custom validation
  }

  const newValue: number = Number.parseInt(value)
  return newValue
}

function falsyToUndefined(value: any): any | undefined {
  if (!value || value === 'undefined') {
    return undefined
  }

  return value
}

function handleDateTransform(value: any): Date | undefined {
  if (!value || value === 'undefined') {
    return undefined
  }

  return new Date(value)
}

export class UpdateBankTransactionRefDto {
  @ApiProperty()
  @Expose()
  @IsString()
  @Transform(({ value }) => matchPaymentRef(value))
  paymentRef: string
}

function matchPaymentRef(value: string) {
  const regexPaymentRef = /\b[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}\b/g
  // If not in the valid format an emtpy string will be returned
  const paymentRef = value?.trim().replace(/[ _]+/g, '-').match(regexPaymentRef)

  return paymentRef ? paymentRef[0] : ''
}
