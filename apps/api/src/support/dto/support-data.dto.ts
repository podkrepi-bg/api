import { Prisma } from '.prisma/client'
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { classToPlain, plainToClass, Type } from 'class-transformer'

export class SupportDataDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  public readonly comment: string | null

  @ApiProperty()
  @IsNotEmpty()
  @Type(() => RolesDto)
  public readonly roles: RolesDto

  @ApiProperty()
  @IsNotEmpty()
  @Type(() => BenefactorDto)
  public readonly benefactor: BenefactorDto

  @ApiProperty()
  @IsNotEmpty()
  @Type(() => PartnerDto)
  public readonly partner: PartnerDto

  @ApiProperty()
  @IsNotEmpty()
  @Type(() => VolunteerDto)
  public readonly volunteer: VolunteerDto

  @ApiProperty()
  @IsNotEmpty()
  @Type(() => AssociationMemberDto)
  public readonly associationMember: AssociationMemberDto

  @ApiProperty()
  @IsNotEmpty()
  @Type(() => CompanyDto)
  public readonly company: CompanyDto

  public toJson(): Prisma.JsonObject {
    return classToPlain<SupportDataDto>(this, { excludeExtraneousValues: true })
  }

  public static fromJson(input: Prisma.JsonObject): SupportDataDto {
    return plainToClass<SupportDataDto, Prisma.JsonObject>(SupportDataDto, input, {
      excludeExtraneousValues: true,
    })
  }
}

export class RolesDto {
  @ApiProperty()
  @IsBoolean()
  benefactor: boolean

  @ApiProperty()
  @IsBoolean()
  partner: boolean

  @ApiProperty()
  @IsBoolean()
  associationMember: boolean

  @ApiProperty()
  @IsBoolean()
  company: boolean

  @ApiProperty()
  @IsBoolean()
  volunteer: boolean
}

export class BenefactorDto {
  @ApiProperty()
  @IsBoolean()
  campaignBenefactor: boolean

  @ApiProperty()
  @IsBoolean()
  platformBenefactor: boolean
}

export class PartnerDto {
  @ApiProperty()
  @IsBoolean()
  npo: boolean

  @ApiProperty()
  @IsBoolean()
  bussiness: boolean

  @ApiProperty()
  @IsBoolean()
  other: boolean

  @ApiProperty()
  @IsString()
  otherText: string
}
export class VolunteerDto {
  @ApiProperty()
  @IsBoolean()
  backend: boolean

  @ApiProperty()
  @IsBoolean()
  frontend: boolean

  @ApiProperty()
  @IsBoolean()
  marketing: boolean

  @ApiProperty()
  @IsBoolean()
  designer: boolean

  @ApiProperty()
  @IsBoolean()
  projectManager: boolean

  @ApiProperty()
  @IsBoolean()
  devOps: boolean

  @ApiProperty()
  @IsBoolean()
  security: boolean

  @ApiProperty()
  @IsBoolean()
  financesAndAccounts: boolean

  @ApiProperty()
  @IsBoolean()
  lawyer: boolean

  @ApiProperty()
  @IsBoolean()
  qa: boolean
}

export class AssociationMemberDto {
  @ApiProperty()
  @IsBoolean()
  isMember: boolean
}

export class CompanyDto {
  @ApiProperty()
  @IsBoolean()
  sponsor: boolean

  @ApiProperty()
  @IsBoolean()
  volunteer: boolean

  @ApiProperty()
  @IsBoolean()
  other: boolean

  @ApiProperty()
  @IsString()
  otherText: string
}
