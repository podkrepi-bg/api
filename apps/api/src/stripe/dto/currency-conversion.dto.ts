import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Currency } from '@prisma/client'
import { Expose } from 'class-transformer'
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator'

/**
 * Request DTO for bulk currency conversion of all subscriptions
 * Designed to be generic for future currency conversions (e.g., BGN to EUR)
 */
export class ConvertSubscriptionsCurrencyDto {
  @ApiProperty({ enum: Currency, description: 'Source currency to convert from' })
  @Expose()
  @IsEnum(Currency)
  sourceCurrency: Currency

  @ApiProperty({ enum: Currency, description: 'Target currency to convert to' })
  @Expose()
  @IsEnum(Currency)
  targetCurrency: Currency

  @ApiPropertyOptional({
    description:
      'Exchange rate to MULTIPLY source amount by. For BGN→EUR use ~0.5113 (not 1.95583). ' +
      'If not provided, uses the fixed BGN/EUR rate automatically.',
    example: 0.5113,
  })
  @Expose()
  @IsNumber()
  @IsOptional()
  exchangeRate?: number

  @ApiPropertyOptional({
    description: 'Run in dry-run mode without making actual changes',
    default: false,
  })
  @Expose()
  @IsBoolean()
  @IsOptional()
  dryRun?: boolean

  @ApiPropertyOptional({
    description: 'Batch size for processing subscriptions (for pagination)',
    default: 100,
  })
  @Expose()
  @IsNumber()
  @IsOptional()
  batchSize?: number

  @ApiPropertyOptional({
    description:
      'Delay in milliseconds between each conversion to respect Stripe rate limits. ' +
      'Stripe allows ~100 requests/second in live mode, ~25/second in test mode.',
    default: 100,
  })
  @Expose()
  @IsNumber()
  @IsOptional()
  delayMs?: number
}

/**
 * Request DTO for single subscription currency conversion
 */
export class ConvertSingleSubscriptionCurrencyDto {
  @ApiProperty({ enum: Currency, description: 'Target currency to convert to' })
  @Expose()
  @IsEnum(Currency)
  targetCurrency: Currency

  @ApiPropertyOptional({
    description: 'Custom exchange rate. If not provided, uses fixed rate for known pairs',
  })
  @Expose()
  @IsNumber()
  @IsOptional()
  exchangeRate?: number

  @ApiPropertyOptional({
    description: 'Run in dry-run mode without making actual changes',
    default: false,
  })
  @Expose()
  @IsBoolean()
  @IsOptional()
  dryRun?: boolean
}

/**
 * Individual subscription conversion result
 */
export class SubscriptionConversionResultDto {
  @ApiProperty({ description: 'Stripe subscription ID' })
  @Expose()
  subscriptionId: string

  @ApiProperty({ description: 'Original amount in cents' })
  @Expose()
  originalAmount: number

  @ApiProperty({ description: 'Converted amount in cents' })
  @Expose()
  convertedAmount: number

  @ApiProperty({ enum: Currency, description: 'Original currency before conversion' })
  @Expose()
  originalCurrency: string

  @ApiProperty({ enum: Currency, description: 'Target currency after conversion' })
  @Expose()
  targetCurrency: Currency

  @ApiProperty({ description: 'Whether the conversion was successful' })
  @Expose()
  success: boolean

  @ApiPropertyOptional({ description: 'Error message if conversion failed' })
  @Expose()
  @IsString()
  @IsOptional()
  errorMessage?: string

  @ApiPropertyOptional({ description: 'Campaign ID from subscription metadata' })
  @Expose()
  @IsString()
  @IsOptional()
  campaignId?: string
}

/**
 * Response DTO for bulk currency conversion operation
 */
export class ConvertSubscriptionsCurrencyResponseDto {
  @ApiProperty({ description: 'Total subscriptions processed' })
  @Expose()
  totalFound: number

  @ApiProperty({ description: 'Number of successfully converted subscriptions' })
  @Expose()
  successCount: number

  @ApiProperty({ description: 'Number of failed conversions' })
  @Expose()
  failedCount: number

  @ApiProperty({
    description:
      'Number of subscriptions skipped (already in target currency or not matching source)',
  })
  @Expose()
  skippedCount: number

  @ApiProperty({ description: 'Exchange rate used for conversion' })
  @Expose()
  exchangeRate: number

  @ApiProperty({ enum: Currency, description: 'Source currency' })
  @Expose()
  sourceCurrency: Currency

  @ApiProperty({ enum: Currency, description: 'Target currency' })
  @Expose()
  targetCurrency: Currency

  @ApiProperty({ description: 'Whether this was a dry run (no actual changes made)' })
  @Expose()
  dryRun: boolean

  @ApiProperty({
    type: [SubscriptionConversionResultDto],
    description: 'Detailed results for each subscription',
  })
  @Expose()
  results: SubscriptionConversionResultDto[]

  @ApiProperty({ description: 'Timestamp when conversion started' })
  @Expose()
  startedAt: Date

  @ApiProperty({ description: 'Timestamp when conversion completed' })
  @Expose()
  completedAt: Date
}
