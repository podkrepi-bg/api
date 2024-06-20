import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import type Stripe from 'stripe'

export class CreateUpdatePaymentFromStripeChargeDto {
  @ApiProperty()
  @Expose()
  stripe: Stripe.Charge
}
