import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsOptional, IsString, ValidateIf } from 'class-validator'

export class IrisCreateCustomerDto {
  @ApiProperty()
  @Expose()
  @IsString()
  @IsOptional()
  companyName?: string

  @ApiProperty()
  @Expose()
  @ValidateIf((obj) => obj.companyName !== undefined)
  @IsString()
  uic?: string

  @ApiProperty()
  @Expose()
  @IsString()
  @IsOptional()
  name?: string

  @ApiProperty()
  @Expose()
  @IsString()
  @IsOptional()
  middleName?: string

  @ApiProperty()
  @Expose()
  @IsString()
  @IsOptional()
  family?: string

  @ApiProperty()
  @Expose()
  @IsString()
  @IsOptional()
  identityHash?: string

  @ApiProperty()
  @Expose()
  @ValidateIf((obj) => obj.name !== undefined)
  @IsString()
  email: string

  @ApiProperty()
  @Expose()
  @IsString()
  @IsOptional()
  webhookUrl?: string
}
