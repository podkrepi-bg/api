import { ApiProperty } from '@nestjs/swagger'
import { Expose, Type } from 'class-transformer'
import { IsBoolean, IsDate, IsEmail, IsOptional, IsString } from 'class-validator'

export class UpdatePersonDto {
  @ApiProperty()
  @Expose()
  @IsString()
  @IsOptional()
  firstName?: string

  @ApiProperty()
  @Expose()
  @IsString()
  @IsOptional()
  lastName?: string

  @ApiProperty()
  @Expose()
  @IsEmail()
  @IsOptional()
  email?: string

  @ApiProperty()
  @Expose()
  @IsString()
  @IsOptional()
  phone?: string

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
}
