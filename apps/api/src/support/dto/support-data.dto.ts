import { IsBoolean, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Expose, Type } from 'class-transformer'

@Expose()
export class RolesDto {
  @ApiProperty()
  @Expose()
  @IsBoolean()
  benefactor: boolean

  @ApiProperty()
  @Expose()
  @IsBoolean()
  partner: boolean

  @ApiProperty()
  @Expose()
  @IsBoolean()
  associationMember: boolean

  @ApiProperty()
  @Expose()
  @IsBoolean()
  company: boolean

  @ApiProperty()
  @Expose()
  @IsBoolean()
  volunteer: boolean
}

@Expose()
export class BenefactorDto {
  @ApiProperty()
  @Expose()
  @IsBoolean()
  campaignBenefactor: boolean

  @ApiProperty()
  @Expose()
  @IsBoolean()
  platformBenefactor: boolean
}

@Expose()
export class PartnerDto {
  @ApiProperty()
  @Expose()
  @IsBoolean()
  npo: boolean

  @ApiProperty()
  @Expose()
  @IsBoolean()
  bussiness: boolean

  @ApiProperty()
  @Expose()
  @IsString()
  otherText: string
}
@Expose()
export class VolunteerDto {
  @ApiProperty()
  @Expose()
  @IsBoolean()
  backend: boolean

  @ApiProperty()
  @Expose()
  @IsBoolean()
  frontend: boolean

  @ApiProperty()
  @Expose()
  @IsBoolean()
  marketing: boolean

  @ApiProperty()
  @Expose()
  @IsBoolean()
  designer: boolean

  @ApiProperty()
  @Expose()
  @IsBoolean()
  projectManager: boolean

  @ApiProperty()
  @Expose()
  @IsBoolean()
  devOps: boolean

  @ApiProperty()
  @Expose()
  @IsBoolean()
  security: boolean

  @ApiProperty()
  @Expose()
  @IsBoolean()
  financesAndAccounts: boolean

  @ApiProperty()
  @Expose()
  @IsBoolean()
  lawyer: boolean

  @ApiProperty()
  @Expose()
  @IsBoolean()
  qa: boolean
}

@Expose()
export class AssociationMemberDto {
  @ApiProperty()
  @Expose()
  @IsBoolean()
  isMember: boolean
}

@Expose()
export class CompanyDto {
  @ApiProperty()
  @Expose()
  @IsBoolean()
  sponsor: boolean

  @ApiProperty()
  @Expose()
  @IsBoolean()
  volunteer: boolean

  @ApiProperty()
  @Expose()
  @IsString()
  otherText: string
}

export class SupportDataDto {
  @ApiProperty()
  @Expose()
  @IsString()
  @IsOptional()
  public readonly comment: string | null

  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @Expose()
  @ValidateNested()
  @Type(() => RolesDto)
  public readonly roles: RolesDto

  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @Expose()
  @ValidateNested()
  @Type(() => BenefactorDto)
  public readonly benefactor: BenefactorDto

  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @Expose()
  @ValidateNested()
  @Type(() => PartnerDto)
  public readonly partner: PartnerDto

  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @Expose()
  @ValidateNested()
  @Type(() => VolunteerDto)
  public readonly volunteer: VolunteerDto

  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @Expose()
  @ValidateNested()
  @Type(() => AssociationMemberDto)
  public readonly associationMember: AssociationMemberDto

  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @Expose()
  @ValidateNested()
  @Type(() => CompanyDto)
  public readonly company: CompanyDto
}
