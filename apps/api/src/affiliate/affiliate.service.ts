import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AffiliateStatus, DonationStatus } from '@prisma/client'

@Injectable()
export class AffiliateService {
  constructor(private readonly prismaService: PrismaService) {}
  async create(companyId: string) {
    const affiliate = await this.prismaService.affiliate.create({
      data: { companyId },
    })
    return affiliate
  }

  async findOneById(id: string) {
    return await this.prismaService.affiliate.findUnique({ where: { id } })
  }

  async findDonationsByCustomerId(
    affiliateCode: string,
    extCustomerId: string,
    status: DonationStatus | undefined,
    currentPage: number,
    limit: number | undefined,
  ) {
    return await this.prismaService.affiliate.findFirst({
      where: {
        affiliateCode,
        donations: { some: { extCustomerId: { equals: extCustomerId }, status } },
      },
      select: {
        donations: {
          take: limit ? Number(limit) : undefined,
          skip: Number((currentPage - 1) * (limit ?? 0)),
          include: { metadata: true },
        },
      },
    })
  }

  async findAll() {
    return await this.prismaService.affiliate.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        company: {
          select: {
            companyName: true,
            companyNumber: true,
            person: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    })
  }
  async findAffiliateByKeycloakId(keycloakId: string) {
    return await this.prismaService.affiliate.count({
      where: { company: { person: { keycloakId } } },
    })
  }

  async getAffiliateDataByKeycloakId(keycloakId: string) {
    return await this.prismaService.affiliate.findFirst({
      where: { company: { person: { keycloakId } } },
      include: {
        donations: {
          where: { status: DonationStatus.guaranteed },
          include: {
            targetVault: { select: { campaign: { select: { title: true, slug: true } } } },
            affiliate: { select: { company: { select: { companyName: true } } } },
            metadata: { select: { name: true } },
          },
        },
      },
    })
  }

  async findAffiliateDonationsWithPagination(
    affiliateCode: string,
    status: DonationStatus | undefined,
    currentPage: number,
    limit: number | undefined,
  ) {
    return await this.prismaService.affiliate.findUnique({
      where: { affiliateCode },
      select: {
        donations: {
          orderBy: { createdAt: 'desc' },
          where: { status },
          take: limit ? Number(limit) : undefined,
          skip: Number((currentPage - 1) * (limit ?? 0)),
          include: { metadata: true },
        },
      },
    })
  }

  async getAffiliateSummaryByCode(affiliateCode: string) {
    return await this.prismaService.affiliate.findUnique({
      where: { affiliateCode },
      include: {
        donations: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        company: { select: { companyName: true, companyNumber: true, legalPersonName: true } },
      },
    })
  }

  async findOneByCode(affiliateCode: string) {
    return await this.prismaService.affiliate.findUnique({
      where: { affiliateCode },
      include: { company: { select: { person: true } } },
    })
  }

  async updateCode(affiliateId: string, affiliateCode: string) {
    return await this.prismaService.affiliate.update({
      where: { id: affiliateId },
      data: { affiliateCode },
    })
  }

  async updateStatus(
    affiliateId: string,
    status: AffiliateStatus,
    affiliateCode: string | null = null,
  ) {
    const affiliate = await this.prismaService.affiliate.update({
      where: { id: affiliateId },
      data: { status, affiliateCode },
    })
    return affiliate
  }
}
