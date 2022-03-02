import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

@Expose()
export class CreateBootcampSimeonDto {
  @Expose()
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @Expose()
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @Expose()
  @ApiProperty()
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  email: string;

  @Expose()
  @ApiProperty()
  @IsOptional()
  phoneNumber: number;
}
