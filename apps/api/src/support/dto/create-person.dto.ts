import { Prisma } from '.prisma/client'
import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsEmail, IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator'

@Expose()
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
  @Expose()
  @IsOptional()
  @IsString()
  public readonly phone: string

  @ApiProperty({ nullable: true, required: false })
  @Expose()
  @IsOptional()
  @IsString()
  public readonly company: string | null

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsBoolean()
  public readonly newsletter: boolean | null

  public toEntity(): Prisma.PersonCreateInput {
    return {
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      phone: this.phone,
      newsletter: this.newsletter,
      company: this.company,
    }
  }
}
