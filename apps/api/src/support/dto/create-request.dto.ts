import { Prisma } from '.prisma/client'
import { ApiProperty } from '@nestjs/swagger'
import { Expose, Type } from 'class-transformer'
import { CreatePersonDto } from '@podkrepi-bg/podkrepi-types'
import { IsNotEmpty, IsObject, ValidateNested } from 'class-validator'

import { SupportDataDto } from './support-data.dto'

@Expose()
export class CreateRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  @IsObject()
  @ValidateNested()
  @Type(() => CreatePersonDto)
  public readonly person: CreatePersonDto

  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  @IsObject()
  @ValidateNested()
  @Type(() => SupportDataDto)
  public readonly supportData: SupportDataDto

  public toEntity(): Prisma.SupporterCreateInput {
    const {
      person,
      supportData: { roles, benefactor, partner, company, volunteer, associationMember, comment },
    } = this
    return {
      comment,
      person: {
        connectOrCreate: {
          create: person.toEntity(),
          where: { email: person.email },
        },
      },
      roleBenefactor: roles.benefactor,
      rolePartner: roles.partner,
      roleAssociationMember: roles.associationMember,
      roleCompany: roles.company,
      roleVolunteer: roles.volunteer,
      benefactorCampaign: benefactor.campaignBenefactor,
      benefactorPlatform: benefactor.platformBenefactor,
      partnerNpo: partner.npo,
      partnerBussiness: partner.bussiness,
      partnerOtherText: partner.otherText,
      volunteerBackend: volunteer.backend,
      volunteerFrontend: volunteer.frontend,
      volunteerMarketing: volunteer.marketing,
      volunteerDesigner: volunteer.designer,
      volunteerProjectManager: volunteer.projectManager,
      volunteerDevOps: volunteer.devOps,
      volunteerSecurity: volunteer.security,
      volunteerFinancesAndAccounts: volunteer.financesAndAccounts,
      volunteerLawyer: volunteer.lawyer,
      volunteerQa: volunteer.qa,
      associationMember: associationMember.isMember,
      companySponsor: company.sponsor,
      companyVolunteer: company.volunteer,
      companyOtherText: company.otherText,
    }
  }
}
