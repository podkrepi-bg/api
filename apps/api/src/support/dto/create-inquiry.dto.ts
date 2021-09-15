import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

import { CreatePersonDto } from './create-person.dto'

export class CreateInquiryDto extends CreatePersonDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public readonly message: string
}
