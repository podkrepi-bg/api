import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsEmail, IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator'

export class CreatePersonDto {
  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsString()
  public readonly firstName: string

  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsString()
  public readonly lastName: string

  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsEmail()
  public readonly email: string

  @ApiProperty({ nullable: true, required: false })
  @IsOptional()
  @IsString()
  public readonly phone: string

  @ApiProperty({ nullable: true, required: false })
  @IsOptional()
  @IsString()
  public readonly company: string | null

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  public readonly newsletter: boolean | null
}
