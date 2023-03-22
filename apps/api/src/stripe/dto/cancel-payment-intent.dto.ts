import Stripe from 'stripe'
import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsOptional } from 'class-validator'

export class CancelPaymentIntentDto implements Stripe.PaymentIntentCancelParams {
  @ApiProperty()
  @Expose()
  @IsOptional()
  cancellation_reason: Stripe.PaymentIntentCancelParams.CancellationReason
}
