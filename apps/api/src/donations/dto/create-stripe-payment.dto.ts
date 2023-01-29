import Stripe from 'stripe'
import { Expose } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator'

export class CreateStripePaymentDto {
  @Expose()
  @ApiProperty()
  @IsString()
  paymentIntentId: Stripe.PaymentIntent['id']

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

  @Expose()
  @ApiProperty()
  @IsString()
  @IsOptional()
  phone: string | null

  @Expose()
  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsEmail()
  personEmail: string

  @Expose()
  @ApiProperty()
  @IsBoolean()
  isAnonymous: boolean
}
