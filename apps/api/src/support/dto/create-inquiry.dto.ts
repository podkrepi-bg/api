import { ApiProperty } from '@nestjs/swagger'
import { plainToClass } from 'class-transformer'
import { IsNotEmpty, IsString } from 'class-validator'
import { SupportInquiryEntity } from '../entity/support-inquiry.entity'

import { CreatePersonDto } from './create-person.dto'

export class CreateInquiryDto extends CreatePersonDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public readonly message: string

  public toEntity(): SupportInquiryEntity {
    return plainToClass<SupportInquiryEntity, Partial<CreateInquiryDto>>(
      SupportInquiryEntity,
      this,
      { excludeExtraneousValues: true },
    )
  }

  public static fromEntity(entity: SupportInquiryEntity): CreateInquiryDto {
    return plainToClass<CreateInquiryDto, Partial<SupportInquiryEntity>>(CreateInquiryDto, entity, {
      excludeExtraneousValues: true,
    })
  }
}
