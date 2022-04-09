import { ApiProperty } from "@nestjs/swagger"
import { Expose } from "class-transformer"
import { IsBoolean, IsEmail, IsString } from "class-validator"

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
  birthday?: Date
  
  @ApiProperty()
  @Expose()
  personalNumber?: string
  
  @ApiProperty()
  @Expose()
  keycloakId?: string
 
  @ApiProperty()
  @Expose()
  stripeCustomerId?: string
}
