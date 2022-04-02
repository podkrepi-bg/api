import { ApiProperty } from '@nestjs/swagger'
import { Prisma } from '@prisma/client'
import { Expose } from 'class-transformer'
import { IsString, MaxLength, IsOptional, IsUUID, IsISO31661Alpha2 } from 'class-validator'

@Expose()
export class CreateCompanyDto {
  @Expose()
  @IsString()
  @ApiProperty()
  @MaxLength(100)
  companyName: string

  @Expose()
  @IsString()
  @ApiProperty({
    description:
      'BULSTAT Unified Identification Code (UIC) https://psc.egov.bg/en/psc-starting-a-business-bulstat',
  })
  @IsUUID()
  companyNumber: string

  @Expose()
  @IsString()
  @IsOptional()
  @ApiProperty()
  legalPersonName: string | null

  @Expose()
  @IsISO31661Alpha2()
  @IsOptional()
  @ApiProperty()
  countryCode: string | null

  @Expose()
  @IsUUID()
  @IsString()
  @IsOptional()
  @ApiProperty()
  cityId: string | null

  public toEntity(): Prisma.CompanyCreateInput {
    return {
      companyName: this.companyName,
      companyNumber: this.companyNumber,
      cityId: this.cityId,
      countryCode: this.countryCode,
      legalPersonName: this.legalPersonName,
    }
  }
}
