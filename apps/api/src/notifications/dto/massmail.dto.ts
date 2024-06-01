import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsNumber, IsOptional, IsString } from 'class-validator'

export class MassMailDto {
  @ApiProperty()
  @Expose()
  @IsString()
  listId: string

  @ApiProperty()
  @Expose()
  @IsString()
  templateId: string

  @ApiProperty()
  @Expose()
  @IsString()
  @IsOptional()
  subject: string

  //Sendgrid limits sending emails to 1000 at once.
  @ApiProperty()
  @Expose()
  @IsNumber()
  @IsOptional()
  chunkSize: number = 999
}
