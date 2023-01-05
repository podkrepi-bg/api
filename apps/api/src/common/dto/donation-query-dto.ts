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
  @Transform(({ value }) => toUndefined(value))
  campaignId?: string

  @Expose()
  @IsOptional()
  @Transform(({ value }) => toUndefined(value))
  status?: DonationStatus

  @Expose()
  @IsOptional()
  @Transform(({ value }) => toUndefined(value))
  type?: DonationType

  @Expose()
  @IsOptional()
  @Transform(({ value }) => toUndefined(value))
  from?: Date

  @Expose()
  @IsOptional()
  @Transform(({ value }) => toUndefined(value))
  to?: Date

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

function toUndefined(value: any): any | undefined {
  return !value ? undefined : value
}
