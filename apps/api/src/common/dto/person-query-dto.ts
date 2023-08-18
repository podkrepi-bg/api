import { Expose, Transform } from 'class-transformer'
import { IsOptional } from 'class-validator'

export class PersonQueryDto {
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
  @Transform(({ value }) => falsyToUndefined(value))
  sortOrder?: string

  @Expose()
  @IsOptional()
  @Transform(({ value }) => toNumber(value))
  pageindex?: number

  @Expose()
  @IsOptional()
  @Transform(({ value }) => toNumber(value))
  pagesize?: number
}

function toNumber(value: string): number | undefined {
  if (!value || Number.isNaN(value)) {
    return undefined
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
