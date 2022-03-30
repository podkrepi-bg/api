import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'
import { Expose } from 'class-transformer'
import { Prisma } from '@prisma/client'

@Expose()
export class CreateBootcampDto {
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
  @IsString()
  city: string

  public toEntity(): Prisma.BootcampCreateInput {
    return {
      firstName: this.firstName,
      lastName: this.lastName,
      city: this.city,
    }
  }
}
