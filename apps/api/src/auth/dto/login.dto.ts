import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsEmail, IsNotEmpty, IsString } from 'class-validator'

export class LoginDto {
  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsEmail()
  email: string

  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsString()
  password: string
}
