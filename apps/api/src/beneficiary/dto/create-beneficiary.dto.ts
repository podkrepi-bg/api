import {
  IsEnum,
  IsISO31661Alpha2,
  IsNotEmpty,
  IsUUID,
  IsString,
  IsOptional,
  ValidateIf,
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { BeneficiaryType, PersonRelation, Prisma } from '.prisma/client'

@Expose()
export class CreateBeneficiaryDto {
  @ApiProperty({ enum: BeneficiaryType })
  @Expose()
  @IsEnum(BeneficiaryType)
  type: BeneficiaryType

  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  @IsUUID()
  @IsOptional()
  @ValidateIf(
    (data) =>
      (data.type === BeneficiaryType.individual && data.personId) ||
      (data.type === BeneficiaryType.company && data.companyId),
  )
  public readonly personId: string

  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  @IsUUID()
  @IsOptional()
  @ValidateIf(
    (data) =>
      (data.type === BeneficiaryType.individual && data.personId) ||
      (data.type === BeneficiaryType.company && data.companyId),
  )
  public readonly companyId: string

  @ApiProperty()
  @IsNotEmpty()
  @IsOptional()
  @Expose()
  @IsUUID()
  public readonly coordinatorId: string

  @ApiProperty({ enum: PersonRelation })
  @Expose()
  @IsOptional()
  @IsEnum(PersonRelation)
  coordinatorRelation: PersonRelation

  @ApiProperty()
  @IsNotEmpty()
  @IsOptional()
  @Expose()
  @IsUUID()
  public readonly organizerId: string

  @ApiProperty({ enum: PersonRelation })
  @Expose()
  @IsOptional()
  @IsEnum(PersonRelation)
  organizerRelation: PersonRelation

  @ApiProperty()
  @Expose()
  @IsISO31661Alpha2()
  countryCode: string

  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsUUID()
  cityId: string

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsString()
  description: string

  @ApiProperty()
  @Expose()
  @IsOptional()
  privateData: Prisma.InputJsonValue

  @ApiProperty()
  @Expose()
  @IsOptional()
  publicData: Prisma.InputJsonValue
}
