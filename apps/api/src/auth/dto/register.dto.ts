import { ApiProperty } from '@nestjs/swagger'
import { Expose, Transform } from 'class-transformer'
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator'

export enum ProfileType {
  INDIVIDUAL = 'individual',
  CORPORATE = 'corporate',
}

export class RegisterDto {
  @ApiProperty()
  @Expose()
  @IsEnum(ProfileType)
  public readonly type: ProfileType = ProfileType.INDIVIDUAL

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

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsBoolean()
  public readonly helpUsImprove?: boolean

  @ValidateIf((o) => o.type === ProfileType.CORPORATE)
  @Expose()
  @IsString()
  @ApiProperty()
  @MaxLength(100)
  companyName: string | undefined

  @ValidateIf((o) => o.type === ProfileType.CORPORATE)
  @Expose()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Matches(/^(\d{9}|\d{13})$/, { message: 'companyNumber must be a 9 or 13 digit EIK' })
  @ApiProperty({
    description:
      'BULSTAT Unified Identification Code (UIC) https://psc.egov.bg/en/psc-starting-a-business-bulstat',
  })
  companyNumber: string | undefined
}
