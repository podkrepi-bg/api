import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsString, IsUUID } from 'class-validator'

export class CreateInfoRequestDto {
  @ApiProperty()
  @Expose()
  @IsString()
  @IsUUID()
  personId: string
  @ApiProperty()
  @Expose()
  @IsString()
  message: string
}
