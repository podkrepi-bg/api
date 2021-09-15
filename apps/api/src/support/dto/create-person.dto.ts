import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator'

export class CreatePersonDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public readonly firstName: string

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public readonly lastName: string

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  public readonly email: string

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public readonly phone: string

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  public readonly newsletter: boolean | null

  @ApiProperty({ nullable: true, required: false })
  @IsOptional()
  @IsString()
  public readonly company: string | null
}
