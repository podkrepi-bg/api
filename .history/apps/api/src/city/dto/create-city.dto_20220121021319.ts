import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { Prisma } from '.prisma/client'
import { IsNotEmpty, IsString, IsUUID, IsISO31661Alpha2 } from 'class-validator'

export class CreateCityDto {
  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsString()
  name: string

  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsString()
  postalCode: number

  // @ApiProperty()
  // @Expose()
  // @IsISO31661Alpha2()
  // countryCode: string

  // @ApiProperty()
  // @Expose()
  // @IsUUID()
  // countryId: string

  // public toEntity(): Prisma.CityCreateInput {
  //   return {
  //     name: this.name,
  //     postalCode: this.postalCode,
  //     // countryCode: 'BG',
  //     // beneficiaries: { connect: { id: this.beneficiaryId } },
  //   }
  // }
}
