import { ApiProperty } from '@nestjs/swagger/dist/decorators'
import { Prisma } from '@prisma/client'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'

@Expose()
export class CreateHedgehogDto {
  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  firstName: string
  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  lastName: string
}
