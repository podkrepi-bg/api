import Stripe from 'stripe'
import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'

export class CreateSetupIntentDto implements Stripe.SetupIntentCreateParams {
  @ApiProperty()
  @Expose()
  metadata: Stripe.MetadataParam
}
