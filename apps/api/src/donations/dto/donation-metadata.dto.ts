import { ApiProperty } from '@nestjs/swagger'
import { Expose, Type } from 'class-transformer'
import { IsObject, IsOptional, IsString } from 'class-validator'

class TExtraData {
  [key: string]: boolean | string | null
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
  @Type(() => TExtraData)
  @IsOptional()
  extraData: TExtraData | undefined
}
