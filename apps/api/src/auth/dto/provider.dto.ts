import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsJWT, IsNotEmpty, IsString } from 'class-validator'

export class ProviderDto {
  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsString()
  @IsJWT()
  public readonly providerToken: string
  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsString()
  public readonly provider: string
}
