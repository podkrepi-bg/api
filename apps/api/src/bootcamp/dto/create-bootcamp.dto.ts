import { ApiProperty } from '@nestjs/swagger'
import { BootcampStatus } from '@prisma/client'
import { Expose } from 'class-transformer'
import { IsDateString, IsEmail, IsNotEmpty, IsString } from 'class-validator'
@Expose()
export class CreateBootcampDto {
  @ApiProperty({enum:BootcampStatus})
  @Expose()
  @IsNotEmpty()
  status: BootcampStatus
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
  endDate: Date
  @ApiProperty()
  @Expose()
  @IsDateString()
  @IsNotEmpty()
  startDate:Date
  @ApiProperty()
  @Expose()
  @IsString()
  firstName: string
  @ApiProperty()
  @Expose()
  @IsString()
  lastName: string

}
