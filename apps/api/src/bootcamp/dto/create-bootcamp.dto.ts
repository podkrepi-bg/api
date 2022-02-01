import { ApiProperty } from '@nestjs/swagger/dist/decorators'
import { Expose } from 'class-transformer'
import { IsString } from 'class-validator'
import { Prisma } from '.prisma/client'

export class CreateBootcampDto {
  @ApiProperty()
  @Expose()
  @IsString()
  firstName: string
  @ApiProperty()
  @Expose()
  @IsString()
  lastName: string

  public toEntity(): Prisma.BootcampCreateInput {
    return {
      firstName: this.firstName,
      lastName: this.lastName,
    }
  }
}
