import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsNotEmpty, IsObject } from 'class-validator'

import { CreatePersonDto } from './create-person.dto'
import { SupportDataDto } from './support-data.dto'

export class CreateRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsObject()
  @Type(() => CreatePersonDto)
  public readonly person?: CreatePersonDto

  @ApiProperty()
  @IsNotEmpty()
  @IsObject()
  public readonly supportData?: SupportDataDto | null
}
