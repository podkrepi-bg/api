import { IsEmail, IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'

@Expose()
export class UserReportDto {
  @Expose()
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string

  @Expose()
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsIn(['bug', 'feature', 'other'])
  type: string

  @Expose()
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  description: string
}
