import { ApiProperty } from '@nestjs/swagger'
import { SupportRequest as SupportRequestType } from '.prisma/client'
import { IsBoolean, IsDate, IsOptional, IsString, IsUUID } from 'class-validator'

export class SupportRequestEntity implements SupportRequestType {
  @ApiProperty()
  @IsUUID()
  id: string

  @ApiProperty()
  @IsUUID()
  personId: string

  @ApiProperty()
  @IsString()
  @IsOptional()
  comment: string | null

  @ApiProperty()
  @IsDate()
  createdAt: Date

  @ApiProperty()
  @IsDate()
  updatedAt: Date

  @ApiProperty()
  @IsDate()
  deletedAt: Date

  @ApiProperty()
  @IsBoolean()
  roleBenefactor: boolean

  @ApiProperty()
  @IsBoolean()
  rolePartner: boolean

  @ApiProperty()
  @IsBoolean()
  roleAssociationMember: boolean

  @ApiProperty()
  @IsBoolean()
  roleCompany: boolean

  @ApiProperty()
  @IsBoolean()
  roleVolunteer: boolean

  @ApiProperty()
  @IsBoolean()
  benefactorCampaign: boolean

  @ApiProperty()
  @IsBoolean()
  benefactorPlatform: boolean

  @ApiProperty()
  @IsBoolean()
  partnerNpo: boolean

  @ApiProperty()
  @IsBoolean()
  partnerBussiness: boolean

  @ApiProperty()
  @IsString()
  @IsOptional()
  partnerOtherText: string | null

  @ApiProperty()
  @IsBoolean()
  volunteerBackend: boolean

  @ApiProperty()
  @IsBoolean()
  volunteerFrontend: boolean

  @ApiProperty()
  @IsBoolean()
  volunteerMarketing: boolean

  @ApiProperty()
  @IsBoolean()
  volunteerDesigner: boolean

  @ApiProperty()
  @IsBoolean()
  volunteerProjectManager: boolean

  @ApiProperty()
  @IsBoolean()
  volunteerDevOps: boolean

  @ApiProperty()
  @IsBoolean()
  volunteerSecurity: boolean

  @ApiProperty()
  @IsBoolean()
  volunteerFinancesAndAccounts: boolean

  @ApiProperty()
  @IsBoolean()
  volunteerLawyer: boolean

  @ApiProperty()
  @IsBoolean()
  volunteerQa: boolean

  @ApiProperty()
  @IsBoolean()
  associationMember: boolean

  @ApiProperty()
  @IsBoolean()
  companySponsor: boolean

  @ApiProperty()
  @IsBoolean()
  companyVolunteer: boolean

  @ApiProperty()
  @IsString()
  @IsOptional()
  companyOtherText: string | null
}
