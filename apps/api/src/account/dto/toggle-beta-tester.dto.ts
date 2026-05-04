import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsBoolean } from 'class-validator'

export class ToggleBetaTesterDto {
  @ApiProperty()
  @Expose()
  @IsBoolean()
  assign: boolean
}
