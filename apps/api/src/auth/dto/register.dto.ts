import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

export class RegisterDto {
  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsEmail()
  public readonly email: string

  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsString()
  public readonly password: string

  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsString()
  public readonly firstName: string

  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsString()
  public readonly lastName: string

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsBoolean()
  public readonly newsletter?: boolean
}

export class CompanyRegisterDto extends RegisterDto {
  @Expose()
  @IsString()
  @ApiProperty()
  @MaxLength(100)
  companyName: string

  @Expose()
  @IsString()
  @ApiProperty({
    description:
      'BULSTAT Unified Identification Code (UIC) https://psc.egov.bg/en/psc-starting-a-business-bulstat',
  })
  companyNumber: string
}
