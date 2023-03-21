import { Expose } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator'
import { Currency } from '@prisma/client'

export class CreateSubscriptionPaymentDto {
  @Expose()
  @ApiProperty()
  @IsString()
  @IsOptional()
  campaignId: string

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
