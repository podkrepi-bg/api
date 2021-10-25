import Stripe from 'stripe'
import { Expose } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'
import { IsIn, IsNotEmpty, IsOptional, IsString, IsUrl, IsUUID } from 'class-validator'

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
  @IsUUID()
  public readonly campaignId: string

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsUrl()
  successUrl: string

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsUrl()
  cancelUrl: string
}
