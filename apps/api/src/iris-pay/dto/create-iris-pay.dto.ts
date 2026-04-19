import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator'
import { DonationType } from '@prisma/client'
import { IrisCreateCustomerDto } from './create-iris-customer'

export class IRISCreateCheckoutSessionDto extends IrisCreateCustomerDto {
  @ApiProperty()
  @IsString()
  @Expose()
  campaignId!: string

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Expose()
  amount!: number

  @ApiProperty({ enum: DonationType })
  @IsEnum(DonationType)
  @Expose()
  type!: DonationType

  @ApiProperty()
  @IsBoolean()
  @Expose()
  isAnonymous!: boolean

  @ApiProperty({ required: false })
  @ValidateIf((obj: IRISCreateCheckoutSessionDto) => !obj.isAnonymous)
  @IsUUID()
  @Expose()
  personId?: string

  @ApiProperty()
  @IsString()
  @Expose()
  billingName!: string

  @ApiProperty()
  @IsEmail()
  @Expose()
  billingEmail!: string

  @ApiProperty({ required: false })
  @IsString()
  @Expose()
  @IsOptional()
  successUrl?: string

  @ApiProperty({ required: false })
  @IsString()
  @Expose()
  @IsOptional()
  errorUrl?: string
}
