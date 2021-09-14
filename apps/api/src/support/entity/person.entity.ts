import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Person as PersonType } from '.prisma/client'

export class PersonEntity implements PersonType {
  @ApiProperty()
  @IsUUID()
  id: string

  @ApiProperty()
  @IsDate()
  createdAt: Date

  @ApiProperty()
  @IsDate()
  updatedAt: Date

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  firstName: string | undefined

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  lastName: string | undefined

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string | undefined

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  phone: string | undefined

  @ApiProperty({ nullable: true, required: false })
  @IsOptional()
  @IsString()
  company: string | undefined

  @ApiProperty()
  @IsBoolean()
  newsletter: boolean
}
