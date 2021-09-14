import { IsDate, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { ContactRequest } from '.prisma/client'
import { PersonEntity } from './person.entity'

export class SupportInquiryEntity extends PersonEntity implements ContactRequest {
  @ApiProperty()
  @IsUUID()
  personId: string

  @ApiProperty()
  @IsDate()
  @IsOptional()
  deletedAt: Date

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  message: string | undefined
}
