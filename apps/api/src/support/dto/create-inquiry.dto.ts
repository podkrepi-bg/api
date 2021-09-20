import { Prisma } from '.prisma/client'
import { ApiProperty } from '@nestjs/swagger'
import { Expose, Type } from 'class-transformer'
import { CreatePersonDto } from '@podkrepi-bg/podkrepi-types'
import { IsNotEmpty, IsObject, IsString, ValidateNested } from 'class-validator'

@Expose()
export class CreateInquiryDto {
  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  @IsObject()
  @ValidateNested()
  @Type(() => CreatePersonDto)
  public readonly person: CreatePersonDto

  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsString()
  public readonly message: string

  public toEntity(): Prisma.InfoRequestCreateInput {
    return {
      person: {
        connectOrCreate: {
          create: this.person.toEntity(),
          where: { email: this.person.email },
        },
      },
      message: this.message,
    }
  }
}
