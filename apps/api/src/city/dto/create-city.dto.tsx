import { ApiProperty } from '@nestjs/swagger/dist/decorators'
import { Expose } from 'class-transformer'
import { IsNumber, IsOptional, IsPositive, IsString, IsUUID, Max } from 'class-validator'
import { Prisma } from '.prisma/client'

export class CreateCityDto {
  @ApiProperty()
  @Expose()
  @IsString()
  name: string

  @ApiProperty()
  @IsOptional()
  @Expose()
  @IsNumber()
  @IsPositive()
  @Max(500000)
  postalCode: number

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
