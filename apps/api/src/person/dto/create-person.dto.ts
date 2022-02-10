import { ApiProperty } from "@nestjs/swagger"
import { IsBoolean, IsDate, IsString } from "class-validator"

export class CreatePersonDto {
  @ApiProperty()
  @IsString()
  firstName: string
  @ApiProperty()
  @IsString()
  lastName: string
  @ApiProperty()
  @IsString()
  email: string
  @ApiProperty()
  @IsBoolean()
  emailConfirmed?: boolean
  @ApiProperty()
  @IsString()
  phone?: string
  @ApiProperty()
  @IsString()
  company?: string
  @ApiProperty()
  @IsBoolean()
  newsletter?: boolean
  @ApiProperty()
  @IsString()
  address?: string
  @ApiProperty()
  @IsDate()
  birthday?: Date
  @ApiProperty()
  @IsString()
  personalNumber?: string
  @ApiProperty()
  @IsString()
  keycloakId?: string
  @ApiProperty()
  @IsString()
  stripeCustomerId?: string
}
