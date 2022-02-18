import { Beneficiary } from '.prisma/client'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto'

@Injectable()
export class BeneficiaryService {
  constructor(private prisma: PrismaService) {}

  async createBeneficiary(inputDto: CreateBeneficiaryDto): Promise<Beneficiary> {
    return this.prisma.beneficiary.create({ data: inputDto })
  }

  async listBeneficiaries(): Promise<Beneficiary[]> {
    return this.prisma.beneficiary.findMany({})
  }

  async viewOne(id: string): Promise<Beneficiary | null> {
    return await this.prisma.beneficiary.findFirst({ where: { id } })
  }

  async updateOne(id: string, data: CreateBeneficiaryDto): Promise<Beneficiary | null> {
    return await this.prisma.beneficiary.update({ where: { id }, data })
  }

  async removeOne(id: string): Promise<Beneficiary | null> {
    return await this.prisma.beneficiary.delete({ where: { id } })
  }
}
