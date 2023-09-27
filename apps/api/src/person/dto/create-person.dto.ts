import { ApiProperty } from '@nestjs/swagger'
import { Expose, Type } from 'class-transformer'
import { IsBoolean, IsDate, IsEmail, IsOptional, IsString } from 'class-validator'

export class CreatePersonDto {
  @ApiProperty()
  @Expose()
  @IsString()
  firstName: string

  @ApiProperty()
  @Expose()
  @IsString()
  lastName: string

  @ApiProperty()
  @Expose()
  @IsEmail()
  @IsOptional()
  email?: string

  @ApiProperty()
  @Expose()
  @IsBoolean()
  @IsOptional()
  emailConfirmed?: boolean

  @ApiProperty()
  @Expose()
  @IsString()
  @IsOptional()
  phone?: string

  @ApiProperty()
  @Expose()
  @IsString()
  @IsOptional()
  company?: string

  @ApiProperty()
  @Expose()
  @IsBoolean()
  @IsOptional()
  newsletter?: boolean

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsString()
  address?: string

  @ApiProperty()
  @Expose()
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  birthday?: Date

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsString()
  personalNumber?: string

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsString()
  keycloakId?: string

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsString()
  stripeCustomerId?: string
}
