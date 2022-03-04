import { IsEnum, IsISO31661Alpha2, IsNotEmpty, IsUUID, IsString, IsOptional } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { BeneficiaryType, PersonRelation, Prisma } from '.prisma/client'

@Expose()
export class UpdateBeneficiaryDto {
  @ApiProperty({ enum: BeneficiaryType })
  @Expose()
  @IsEnum(BeneficiaryType)
  type: BeneficiaryType

  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  @IsUUID()
  public readonly personId: string

  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  @IsUUID()
  public readonly coordinatorId: string

  @ApiProperty({ enum: PersonRelation })
  @Expose()
  @IsEnum(PersonRelation)
  coordinatorRelation: PersonRelation

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
