import { ApiProperty } from '@nestjs/swagger'
import { City } from '@prisma/client'
import { Expose } from 'class-transformer'
import { IsISO31661Alpha2, IsOptional, IsString } from 'class-validator'

@Expose()
export class CreateCountryDto {
  @ApiProperty()
  @Expose()
  @IsString()
  name: string

  @ApiProperty()
  @Expose()
  @IsString()
  @IsISO31661Alpha2()
  countryCode: string

  @ApiProperty()
  @Expose()
  @IsOptional()
  cities: City[]
}
