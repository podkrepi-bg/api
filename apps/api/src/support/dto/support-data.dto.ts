import { IsBoolean, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Expose, Type } from 'class-transformer'

@Expose()
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

@Expose()
export class BenefactorDto {
  @ApiProperty()
  @IsBoolean()
  campaignBenefactor: boolean

  @ApiProperty()
  @IsBoolean()
  platformBenefactor: boolean
}

@Expose()
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
@Expose()
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

@Expose()
export class AssociationMemberDto {
  @ApiProperty()
  @IsBoolean()
  isMember: boolean
}

@Expose()
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
export class SupportDataDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  public readonly comment: string | null

  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  @ValidateNested()
  @Type(() => RolesDto)
  public readonly roles: RolesDto

  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  @ValidateNested()
  @Type(() => BenefactorDto)
  public readonly benefactor: BenefactorDto

  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  @ValidateNested()
  @Type(() => PartnerDto)
  public readonly partner: PartnerDto

  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  @ValidateNested()
  @Type(() => VolunteerDto)
  public readonly volunteer: VolunteerDto

  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  @ValidateNested()
  @Type(() => AssociationMemberDto)
  public readonly associationMember: AssociationMemberDto

  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  @ValidateNested()
  @Type(() => CompanyDto)
  public readonly company: CompanyDto
}
