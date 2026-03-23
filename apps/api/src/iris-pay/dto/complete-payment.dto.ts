import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsString, IsNumber, IsObject, ValidateNested, IsOptional } from 'class-validator'
import { Type } from 'class-transformer'
import { FinishPaymentMetadataDto } from './finish-payment.dto'

export class CompletePaymentDto {
  @Expose()
  @ApiProperty()
  @IsString()
  status: string

  @Expose()
  @ApiProperty()
  @IsNumber()
  amount: number

  @Expose()
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  billingName?: string

  @Expose()
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  billingEmail?: string

  @Expose()
  @ApiProperty({ type: FinishPaymentMetadataDto })
  @IsObject()
  @ValidateNested()
  @Type(() => FinishPaymentMetadataDto)
  metadata: FinishPaymentMetadataDto
}
