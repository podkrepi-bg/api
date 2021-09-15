import { Prisma } from '.prisma/client'
import { ApiProperty } from '@nestjs/swagger'
import { Expose, Type } from 'class-transformer'
import { IsNotEmpty, IsObject, IsString, ValidateNested } from 'class-validator'
import { CreatePersonDto } from './create-person.dto'

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

  public toEntity(): Prisma.ContactRequestCreateInput {
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
