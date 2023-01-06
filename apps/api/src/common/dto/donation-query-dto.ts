import { DonationStatus, DonationType } from '@prisma/client'
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
  type?: DonationType

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
