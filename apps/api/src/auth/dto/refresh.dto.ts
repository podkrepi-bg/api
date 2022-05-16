import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsJWT, IsNotEmpty, IsString } from 'class-validator'

export class RefreshDto {
  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsString()
  @IsJWT()
  public readonly refreshToken: string
}
