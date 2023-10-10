import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AffiliateStatus } from '@prisma/client'

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
