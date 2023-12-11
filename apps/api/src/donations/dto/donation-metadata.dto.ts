import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsObject, IsOptional, IsString } from 'class-validator'

type TExtraData = {
  [key: string]: string | null | number | boolean
}

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
  extraData: TExtraData | undefined
}
