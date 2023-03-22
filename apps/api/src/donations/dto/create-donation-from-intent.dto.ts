import Stripe from 'stripe'
import { Expose } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsEmail, IsNumber, IsOptional, IsString } from 'class-validator'

export class CreateDonationFromIntentDto {
  @Expose()
  @ApiProperty()
  @IsString()
  setupIntentId: Stripe.SetupIntent['id']

  @Expose()
  @ApiProperty()
  @IsNumber()
  amount: number

  @Expose()
  @ApiProperty()
  @IsBoolean()
  isAnonymous: boolean

  @Expose()
  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsEmail()
  personEmail: string

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
}
