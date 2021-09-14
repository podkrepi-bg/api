import { ApiProperty } from '@nestjs/swagger'
import { plainToClass, Type } from 'class-transformer'
import { IsNotEmpty, IsObject } from 'class-validator'

import { SupportRequestEntity } from '../entity/support-request.entity'
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

  public toEntity(): SupportRequestEntity {
    return plainToClass<SupportRequestEntity, Partial<CreateRequestDto>>(
      SupportRequestEntity,
      this,
      { excludeExtraneousValues: true },
    )
  }

  public static fromEntity(entity: SupportRequestEntity): CreateRequestDto {
    return plainToClass<CreateRequestDto, Partial<SupportRequestEntity>>(CreateRequestDto, entity, {
      excludeExtraneousValues: true,
    })
  }
}
