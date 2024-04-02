import { ApiProperty } from '@nestjs/swagger'
import { Payment, PaymentStatus } from '@prisma/client'
import { Expose, Type } from 'class-transformer'
import { IsEnum, IsNumber, IsString } from 'class-validator'
import type Stripe from 'stripe'

export class CreateUpdatePaymentFromStripeChargeDto {
  @ApiProperty()
  @Expose()
  stripe: Stripe.Charge
}
