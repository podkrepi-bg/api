import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsNotEmpty, IsString } from 'class-validator'

export class RefreshDto {
  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsString()
  public readonly refreshToken: string
}
