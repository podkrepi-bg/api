import { ApiProperty } from "@nestjs/swagger"
import { Expose, Type } from "class-transformer"
import { IsBoolean, IsDate, IsEmail, IsString } from "class-validator"

export class UpdatePersonDto {
  @ApiProperty()
  @Expose()
  @IsString()
  firstName?: string

  @ApiProperty()
  @Expose()
  @IsString()
  lastName?: string

  @ApiProperty()
  @Expose()
  @IsEmail()
  email?: string

  @ApiProperty()
  @Expose()
  phone?: string

  @ApiProperty()
  @Expose()
  company?: string
  
  @ApiProperty()
  @Expose()
  @IsBoolean()
  newsletter?: boolean

  @ApiProperty()
  @Expose()
  address?: string
  
  @ApiProperty()
  @Expose()
  @Type(() => Date)
  @IsDate()
  birthday?: Date
  
  @ApiProperty()
  @Expose()
  personalNumber?: string
}
