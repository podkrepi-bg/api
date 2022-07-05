import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsString, IsUUID } from 'class-validator'

export class CreateOrganizerDto {
  @IsUUID()
  @ApiProperty()
  @Expose()
  @IsString()
  personId: string
}
