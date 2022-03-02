import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

@Expose()
export class CreateBootcampSimeonDto {
  @Expose()
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @Expose()
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @Expose()
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @Expose()
  @ApiProperty()
  @IsOptional()
  phoneNumber: number;
}
