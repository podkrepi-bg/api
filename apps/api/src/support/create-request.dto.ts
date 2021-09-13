import { Person, Prisma, SupportRequest } from '.prisma/client'
import { ApiProperty } from '@nestjs/swagger'
import { plainToClass } from 'class-transformer'
import { IsEmail, IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator'

export class CreateRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public readonly firstName?: string | undefined

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public readonly lastName?: string | undefined

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  public readonly email?: string | undefined

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public readonly phone?: string | undefined

  @ApiProperty({ nullable: true, required: false })
  @IsOptional()
  @IsString()
  public readonly company?: string | undefined

  @ApiProperty()
  @IsNotEmpty()
  @IsObject()
  public readonly supportData?: string | undefined

  public static toEntity(
    input: CreateRequestDto,
    // groups: string[] = ['create']
  ): Prisma.SupportRequestCreateInput {
    //   const request = plainToClass<SupportRequest, Partial<CreateRequestDto>>(
    //     SupportRequest,
    //     this,
    //     {
    //       groups: groups,
    //     }
    //   )
    return {
      person: {
        create: {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          company: input.company,
        },
      },
      supportData: input.supportData,
    }
  }

  // public static fromEntity(entity: Person): CreateRequestDto {
  //   return plainToClass<PictureDto, Partial<Picture>>(PictureDto, entity, {
  //     excludeExtraneousValues: true,
  //     groups: ['read'],
  //   })
  // }
}
