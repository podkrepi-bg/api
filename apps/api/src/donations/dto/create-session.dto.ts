import Stripe from 'stripe'
import { Expose } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator'

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
  @ValidateIf((o) => !o.amount || o.priceId)
  public readonly priceId: string

  @ApiProperty()
  @Expose()
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  @Min(100, { message: 'Minimum donation amount in cents is 100' })
  @ValidateIf((o) => !o.priceId || o.amount)
  public readonly amount: number

  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsUUID()
  public readonly campaignId: string

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

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsUrl({
    require_tld: process.env.NODE_ENV !== 'development',
  })
  successUrl: string

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsUrl({
    require_tld: process.env.NODE_ENV !== 'development',
  })
  cancelUrl: string
}
