import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsString, IsNumber, IsObject, ValidateNested, IsIn, IsOptional } from 'class-validator'
import { Type } from 'class-transformer'

export class FinishPaymentMetadataDto {
  @Expose()
  @ApiProperty()
  @IsString()
  campaignId: string

  @Expose()
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  personId: string | null

  @Expose()
  @ApiProperty()
  @IsIn(['true', 'false'])
  isAnonymous: 'true' | 'false'

  @Expose()
  @ApiProperty()
  @IsString()
  type: string
}

export class FinishPaymentDto {
  @Expose()
  @ApiProperty()
  @IsString()
  hookHash: string

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
  billingName?: string

  @Expose()
  @ApiProperty({ required: false })
  @IsString()
  billingEmail?: string

  @Expose()
  @ApiProperty({ type: FinishPaymentMetadataDto })
  @IsObject()
  @ValidateNested()
  @Type(() => FinishPaymentMetadataDto)
  metadata: FinishPaymentMetadataDto
}
