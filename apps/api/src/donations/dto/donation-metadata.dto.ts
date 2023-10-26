import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsObject, IsOptional, IsString } from 'class-validator'

export class DonationMetadataDto {
  @ApiProperty()
  @Expose()
  @IsString()
  @IsOptional()
  name: string | undefined

  @ApiProperty()
  @Expose()
  @IsObject()
  @IsOptional()
  //eslint-disable-next-line
  extraData: any
}
