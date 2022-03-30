import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsEmail, IsNotEmpty, IsString } from 'class-validator'
@Expose()
export class CreateBootcampDto {
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
  @IsNotEmpty()
  email: string
  @ApiProperty()
  @Expose()
  @IsString()
  phone: string
  @ApiProperty()
  @Expose()
  @IsString()
  @IsNotEmpty()
  company: string

}
