import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { Prisma } from '.prisma/client'
import { IsNotEmpty, IsString, IsUUID, IsISO31661Alpha2, IsNumber } from 'class-validator'

export class CreateCityDto {
  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsString()
  name: string

  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsNumber()
  postalCode: number

  @ApiProperty()
  @Expose()
  @IsISO31661Alpha2()
  countryCode: string

  // @ApiProperty()
  @Expose()
  // @IsUUID()
  beneficiaryId: string

  public toEntity(): Prisma.CityCreateInput {
    return {
      name: this.name,
      postalCode: this.postalCode,
      countryCode: { connect: { id: this.countryCode } },
      beneficiaries: { connect: { id: this.beneficiaryId } },
    }
  }
}
