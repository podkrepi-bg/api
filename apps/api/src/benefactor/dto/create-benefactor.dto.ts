import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { DocumentType, Prisma } from '@prisma/client'
import { ApiProperty } from '@nestjs/swagger'
import { Person } from '@prisma/client'
import { Expose, Type } from 'class-transformer'
import { IsString } from 'class-validator'
import { CreatePersonDto } from '../../domain/generated/person/dto'

@Expose()
export class CreateBenefactorDto {
  // @ApiProperty()
  // @Expose()
  // @IsString()
  // id: string ;

  // @ApiProperty()
  // @Expose()
  // @IsString()
  // personId: string ;

  @ApiProperty()
  @Expose()
  @IsString()
  extCustomerId: string | null

  // @ApiProperty()
  // @Expose()
  // createdAt: Date ;

  // @ApiProperty()
  // @Expose()
  // @IsString()
  // updatedAt: Date  | null;
  // @ApiProperty()

  @Expose()
  @IsString()
  person?: Person

  public toEntity(): Prisma.BenefactorCreateInput {
    return {
      // id: this.id,
      // personId: this.personId,
      extCustomerId: this.extCustomerId,
      // createdAt: this.createdAt,
      // updatedAt: this.updatedAt,
      person: {
        connect: {
          id: '0a7213d1-6684-4e26-a012-3074afd90108',
        },
      },
    }
  }
}
