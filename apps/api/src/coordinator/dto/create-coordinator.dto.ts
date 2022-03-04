import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsString, IsUUID } from 'class-validator'

export class CreateCoordinatorDto {
  @IsUUID()
  @ApiProperty()
  @Expose()
  @IsString()
  personId: string
}
