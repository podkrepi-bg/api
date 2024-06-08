import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsJWT, IsNotEmpty, IsString, IsUrl } from 'class-validator'

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

  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsString()
  public readonly userId: string

  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsString()
  public readonly email: string

  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsString()
  @IsUrl()
  public readonly picture: string

  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsString()
  public readonly name: string
}
