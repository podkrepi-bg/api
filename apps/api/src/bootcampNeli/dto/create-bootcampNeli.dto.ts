import { Expose } from 'class-transformer'
import { IsEmail, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger/dist/decorators'

import { Prisma } from '.prisma/client'

export class CreateBootcampNeliDto {
  @ApiProperty()
  @Expose()
  @IsString()
  firstName: string

  @ApiProperty()
  @Expose()
  @IsString()
  lastName: string

  @ApiProperty()
  @Expose()
  @IsEmail()
  email: string

  public toEntity(): Prisma.BootcampNeliCreateInput {
    return {
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email
    }
  }
}
