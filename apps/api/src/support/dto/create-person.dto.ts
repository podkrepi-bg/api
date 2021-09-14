import { ApiProperty } from '@nestjs/swagger'
import { plainToClass } from 'class-transformer'
import { IsEmail, IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator'

import { PersonEntity } from '../entity/person.entity'

export class CreatePersonDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public readonly firstName: string

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public readonly lastName: string

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  public readonly email: string

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public readonly phone: string

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  public readonly newsletter: boolean | null

  @ApiProperty({ nullable: true, required: false })
  @IsOptional()
  @IsString()
  public readonly company: string | null

  public toEntity(): PersonEntity {
    return plainToClass<PersonEntity, Partial<CreatePersonDto>>(PersonEntity, this, {
      excludeExtraneousValues: true,
    })
  }

  public static fromEntity(entity: PersonEntity): CreatePersonDto {
    return plainToClass<CreatePersonDto, Partial<PersonEntity>>(CreatePersonDto, entity, {
      excludeExtraneousValues: true,
    })
  }
}
