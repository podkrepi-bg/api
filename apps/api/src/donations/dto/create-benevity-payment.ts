import { ApiProperty } from '@nestjs/swagger'
import { Expose, Type } from 'class-transformer'
import { IsArray, IsNumber, IsObject, IsOptional, IsString, IsUUID } from 'class-validator'

class BenevityDonationDto {
  @ApiProperty()
  @Expose()
  @IsString()
  projectRemoteId: string

  @ApiProperty()
  @Expose()
  @IsString()
  @IsUUID()
  transactionId: string

  @ApiProperty()
  @Expose()
  @IsNumber()
  totalAmount: number

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsString()
  donorFirstName: string

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsString()
  donorLastName: string

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsString()
  email: string
}

class BenevityDataDto {
  @ApiProperty()
  @Expose()
  @IsArray()
  @Type(() => BenevityDonationDto)
  donations: BenevityDonationDto[]
}

export class CreateBenevityPaymentDto {
  @ApiProperty()
  @Expose()
  @IsNumber()
  amount: number

  @ApiProperty()
  @Expose()
  @IsNumber()
  exchangeRate: number

  @ApiProperty()
  @Expose()
  @IsString()
  extPaymentIntentId: string

  @ApiProperty()
  @Expose()
  @IsObject()
  @Type(() => BenevityDataDto)
  benevityData: BenevityDataDto
}
