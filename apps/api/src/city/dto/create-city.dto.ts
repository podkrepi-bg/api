import { ApiProperty } from '@nestjs/swagger/dist/decorators'
import { Expose } from 'class-transformer'
import { IsOptional, IsPostalCode, IsString, IsUUID } from 'class-validator'

import { Prisma } from '.prisma/client'

export class CreateCityDto {
  @ApiProperty()
  @Expose()
  @IsString()
  name: string

  @ApiProperty()
  @IsOptional()
  @Expose()
  @IsPostalCode('BG')
  postalCode: string

  @ApiProperty()
  @Expose()
  @IsUUID()
  countryId: string

  public toEntity(): Prisma.CityCreateInput {
    return {
      name: this.name,
      postalCode: this.postalCode,
      countryCode: { connect: { id: this.countryId } },
    }
  }
}
