import { Beneficiary } from '.prisma/client'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto'

@Injectable()
export class BeneficiaryService {
  constructor(private prisma: PrismaService) {}

  async createBeneficiary(inputDto: CreateBeneficiaryDto): Promise<Beneficiary> {
    return this.prisma.beneficiary.create({ data: inputDto.toEntity() })
  }

  async listBeneficiaries(): Promise<Beneficiary[]> {
    return this.prisma.beneficiary.findMany()
  }
}
