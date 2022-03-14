import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { ApiProperty } from '@nestjs/swagger'
import { Expose, Type } from 'class-transformer'
import { IsString, IsUUID } from 'class-validator'

@Expose()
export class CreateBenefactorDto {
  @ApiProperty()
  @Expose()
  @IsUUID()
  personId: string

  @ApiProperty()
  @Expose()
  @IsString()
  extCustomerId: string | null

  // public toEntity(): Prisma.BenefactorCreateInput {
  //   return {
  //     id: this.id,
  //     extCustomerId: this.extCustomerId,
  //     createdAt: this.createdAt,
  //     updatedAt: this.updatedAt,
  //     personId: this.personId,
  //   }
  // }
}
