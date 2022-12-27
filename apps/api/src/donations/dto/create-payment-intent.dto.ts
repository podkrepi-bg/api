import Stripe from 'stripe'
import { ApiProperty } from '@nestjs/swagger'
import { Currency } from '@prisma/client'
import { Expose } from 'class-transformer'
import { IsNumber } from 'class-validator'

//Create a dto pased on Stripe.PaymentIntentCreateParams
export class CreatePaymentIntentDto implements Stripe.PaymentIntentCreateParams {
  @ApiProperty()
  @Expose()
  @IsNumber()
  amount: number

  @ApiProperty()
  @Expose()
  currency: Currency
}
