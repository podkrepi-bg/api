import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsNotEmpty, IsString } from 'class-validator'
import { CreatePersonDto } from './create-person.dto'

export class CreateInquiryDto extends CreatePersonDto {
  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsString()
  public readonly message: string
}
