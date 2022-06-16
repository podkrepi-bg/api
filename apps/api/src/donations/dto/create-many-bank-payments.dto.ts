import { ApiProperty } from '@nestjs/swagger'
import { Currency, DonationStatus, DonationType, PaymentProvider, Prisma } from '@prisma/client'
import { Expose } from 'class-transformer'
import { IsNumber, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator'

@Expose()
export class CreateManyBankPaymentsDto {
  @Expose()
  @ApiProperty({ enum: DonationType })
  type: DonationType

  @Expose()
  @ApiProperty({ enum: DonationStatus })
  status: DonationStatus

  @Expose()
  @ApiProperty({ enum: PaymentProvider })
  provider: PaymentProvider

  @Expose()
  @ApiProperty({ enum: Currency })
  currency: Currency

  @Expose()
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  amount: number

  @Expose()
  @ApiProperty()
  @IsString()
  extCustomerId: string

  @Expose()
  @ApiProperty()
  @IsString()
  extPaymentIntentId: string

  @Expose()
  @ApiProperty()
  @IsString()
  extPaymentMethodId: string

  @Expose()
  @ApiProperty()
  @IsString()
  @IsUUID()
  targetVaultId: string

  @Expose()
  @ApiProperty()
  @IsString()
  @IsOptional()
  personId: string | null
}
