import { ApiProperty } from '@nestjs/swagger'
import { Expose, Type } from 'class-transformer'
import { IsNotEmpty, IsObject, ValidateNested } from 'class-validator'

import { CreatePersonDto } from './create-person.dto'
import { SupportDataDto } from './support-data.dto'

@Expose()
export class CreateRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => CreatePersonDto)
  public readonly person: CreatePersonDto

  @ApiProperty()
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => SupportDataDto)
  public readonly supportData: SupportDataDto
}
