import { Expose, Transform } from 'class-transformer'
import { IsInt, IsOptional, Max, Min } from 'class-validator'

interface ToNumberOptions {
  min?: number
  max?: number
}

export class PagingQueryDto {
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
