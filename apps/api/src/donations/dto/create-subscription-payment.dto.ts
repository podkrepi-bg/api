import Stripe from 'stripe'
import { Expose } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

export class CreateSubscriptionPaymentDto {
  @Expose()
  @ApiProperty()
  @IsString()
  paymentPriceId: Stripe.Price['id']

  @Expose()
  @ApiProperty()
  @IsString()
  @IsOptional()
  email: string

  @Expose()
  @ApiProperty()
  @IsString()
  @IsOptional()
  firstName: string | null

  @Expose()
  @ApiProperty()
  @IsString()
  @IsOptional()
  lastName: string | null
}
