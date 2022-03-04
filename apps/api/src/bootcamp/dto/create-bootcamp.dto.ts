import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsDateString, IsEmail, IsNotEmpty, IsString } from 'class-validator'
@Expose()
export class CreateBootcampDto {
  @ApiProperty()
  @Expose()
  @IsString()
  @IsNotEmpty()
  status: string
  @ApiProperty()
  @Expose()
  @IsString()
  @IsNotEmpty()
  title: string
  @ApiProperty()
  @Expose()
  @IsEmail()
  @IsNotEmpty()
  email: string
  @ApiProperty()
  @Expose()
  @IsString()
  @IsNotEmpty()
  message: string
  @ApiProperty()
  @Expose()
  @IsDateString()
  @IsNotEmpty()
  date: string
}
