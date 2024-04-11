import { Expose } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator'
import { Currency, DonationType } from '@prisma/client'

export class CreateSubscriptionPaymentDto {
  @Expose()
  @ApiProperty()
  @IsString()
  @IsOptional()
  campaignId: string

  @ApiProperty()
  @Expose()
  @IsEnum(DonationType)
  type: DonationType

  @Expose()
  @ApiProperty()
  @IsNumber()
  amount: number

  @ApiProperty()
  @Expose()
  @IsEnum(Currency)
  currency: Currency

  @Expose()
  @ApiProperty()
  @IsString()
  @IsOptional()
  email: string
}
