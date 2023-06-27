import { DonationStatus, PaymentProvider } from '@prisma/client'
import { Expose, Transform } from 'class-transformer'
import { IsOptional } from 'class-validator'

interface ToNumberOptions {
  min?: number
  max?: number
}

export class DonationQueryDto {
  @Expose()
  @IsOptional()
  @Transform(({ value }) => falsyToUndefined(value))
  campaignId?: string

  @Expose()
  @IsOptional()
  @Transform(({ value }) => falsyToUndefined(value))
  status?: DonationStatus

  @Expose()
  @IsOptional()
  @Transform(({ value }) => falsyToUndefined(value))
  provider?: PaymentProvider

  @Expose()
  @IsOptional()
  @Transform(({ value }) => toNumber(value))
  minAmount?: number

  @Expose()
  @IsOptional()
  @Transform(({ value }) => toNumber(value))
  maxAmount?: number

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
  @Transform(({ value }) => falsyToUndefined(value))
  sortBy?: string

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
  if (!value || Number.isNaN(value)) {
    return undefined
  }
  if (opts.min || opts.max) {
    // TODO: figure out how to trigger custom validation
  }

  const newValue: number = Number.parseInt(value)
  return newValue
}

function falsyToUndefined(value: unknown): unknown | undefined {
  if (!value || value === 'undefined') {
    return undefined
  }

  return value
}

function handleDateTransform(value: unknown): Date | undefined {
  if (!value || value === 'undefined') {
    return undefined
  }

  return new Date(value as string)
}
