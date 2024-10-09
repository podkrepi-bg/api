import Stripe from 'stripe'
import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'

export class UpdateSetupIntentDto implements Stripe.SetupIntentUpdateParams {
  @ApiProperty()
  @Expose()
  metadata: Stripe.MetadataParam
}
