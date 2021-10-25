import Stripe from 'stripe'
import { Expose } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'
import { IsIn, IsNotEmpty, IsString } from 'class-validator'

export class CreateSessionDto {
  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsIn(['payment', 'setup', 'subscription'])
  public readonly mode: Stripe.Checkout.Session.Mode

  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsString()
  public readonly priceId: string

  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsString()
  public readonly campaignId: string
}
