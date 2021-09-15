import { Injectable } from '@nestjs/common'
import { ContactRequest, SupportRequest } from '.prisma/client'

import { PrismaService } from '../prisma/prisma.service'
import { CreateRequestDto } from './dto/create-request.dto'
import { CreateInquiryDto } from './dto/create-inquiry.dto'

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async createSupportRequest(inputDto: CreateRequestDto): Promise<SupportRequest> {
    const {
      person,
      supportData: { roles, benefactor, partner, company, volunteer, associationMember, comment },
    } = inputDto

    return this.prisma.supportRequest.create({
      data: {
        comment,
        person: {
          connectOrCreate: {
            create: {
              firstName: person.firstName,
              lastName: person.lastName,
              email: person.email,
              phone: person.phone,
              company: person.company,
              newsletter: person.newsletter,
            },
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
      },
    })
  }

  async createSupportInquiry(inputDto: CreateInquiryDto): Promise<ContactRequest> {
    return this.prisma.contactRequest.create({
      select: {
        id: true,
        person: false,
        personId: true,
        message: true, // TODO: Find how to hide `message` prop from response
        createdAt: true,
        deletedAt: true,
        updatedAt: true,
      },
      data: {
        person: {
          connectOrCreate: {
            create: {
              firstName: inputDto.firstName,
              lastName: inputDto.lastName,
              email: inputDto.email,
              phone: inputDto.phone,
              newsletter: inputDto.newsletter,
              company: inputDto.company,
            },
            where: { email: inputDto.email },
          },
        },
        message: inputDto.message,
      },
    })
  }
}
