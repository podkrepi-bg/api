import {
  IsEnum,
  IsISO31661Alpha2,
  IsNotEmpty,
  IsObject,
  IsUUID,
  IsString,
  IsOptional,
  ValidateNested,
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Expose, Type } from 'class-transformer'
import { BeneficiaryType, PersonRelation, Prisma } from '.prisma/client'
import { CreatePersonDto } from '@podkrepi-bg/podkrepi-types'

@Expose()
export class CreateBeneficiaryDto {
  @ApiProperty({ enum: BeneficiaryType })
  @Expose()
  @IsEnum(BeneficiaryType)
  type: BeneficiaryType

  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  @IsObject()
  @ValidateNested()
  @Type(() => CreatePersonDto)
  public readonly beneficiary: CreatePersonDto

  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  @IsObject()
  @ValidateNested()
  @Type(() => CreatePersonDto)
  public readonly coordinator: CreatePersonDto

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
  privateData: Prisma.JsonValue

  @ApiProperty()
  @Expose()
  @IsOptional()
  publicData: Prisma.JsonValue

  public toEntity(): Prisma.BeneficiaryCreateInput {
    return {
      type: this.type,
      person: {
        connectOrCreate: {
          create: this.beneficiary.toEntity(),
          where: { email: this.beneficiary.email },
        },
      },
      coordinator: {
        // Here we might also implement creation by coordinator ID
        create: {
          person: {
            connectOrCreate: {
              create: this.coordinator.toEntity(),
              where: { email: this.coordinator.email },
            },
          },
        },
      },
      coordinatorRelation: this.coordinatorRelation,
      description: this.description,
      city: { connect: { id: this.cityId } },
      countryCode: 'BG',
    }
  }
}
