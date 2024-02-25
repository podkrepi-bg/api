import { ApiProperty } from '@nestjs/swagger'
import { Currency, PaymentStatus, PaymentProvider, PaymentType, Prisma } from '@prisma/client'
import { Expose } from 'class-transformer'
import { IsDate, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator'

@Expose()
export class CreateBankPaymentDto {
  @Expose()
  @ApiProperty({ enum: PaymentType })
  type: PaymentType

  @Expose()
  @ApiProperty({ enum: PaymentStatus })
  status: PaymentStatus

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
  @IsDate()
  createdAt: Date

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
  donations: Prisma.DonationCreateNestedManyWithoutPaymentInput

  billingName?: string
  billingEmail?: string
}
