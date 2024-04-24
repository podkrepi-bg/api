import { PartialType } from '@nestjs/mapped-types'
import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsOptional, IsUUID } from 'class-validator'
import { CreatePaymentDto } from './create-payment.dto'

export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {
  @Expose()
  @ApiProperty()
  @IsOptional()
  @IsUUID()
  targetPersonId?: string

  @Expose()
  @ApiProperty()
  @IsOptional()
  billingEmail?: string

  @Expose()
  @ApiProperty()
  @IsOptional()
  donationId?: string
}
