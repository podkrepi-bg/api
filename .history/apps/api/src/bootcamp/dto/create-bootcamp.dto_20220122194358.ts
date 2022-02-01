import { ApiProperty } from '@nestjs/swagger/dist/decorators'
import { Expose } from 'class-transformer'
import { IsString } from 'class-validator'

export class CreateBootcampDto {
  @ApiProperty()
  @Expose()
  @IsString()
  firstName: string
  @ApiProperty()
  @Expose()
  @IsString()
  lastName: string
}
