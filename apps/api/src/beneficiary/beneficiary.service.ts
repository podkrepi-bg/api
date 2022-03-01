import { Beneficiary } from '.prisma/client'
import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto'
import { UpdateBeneficiaryDto } from './dto/update-beneficiary.dto'

@Injectable()
export class BeneficiaryService {
  constructor(private prisma: PrismaService) {}

  async createBeneficiary(inputDto: CreateBeneficiaryDto): Promise<Beneficiary> {
    return this.prisma.beneficiary.create({ data: inputDto })
  }

  async listBeneficiaries(): Promise<Beneficiary[]> {
    return this.prisma.beneficiary.findMany()
  }

  async viewBeneficiary(id: string): Promise<Beneficiary | null | undefined> {
    return this.prisma.beneficiary.findFirst({ where: { id } }).catch(() => {
      throw new NotFoundException(`Could not find beneficiary`)
    })
  }

  async editBeneficiary(
    id: string,
    updateBeneficiaryDto: UpdateBeneficiaryDto,
  ): Promise<Beneficiary | null> {
    const result = await this.prisma.beneficiary.update({
      where: { id },
      data: updateBeneficiaryDto,
    })
    if (!result) throw new NotFoundException('sorry id not found')
    return result
  }

  async removeBeneficiary(id: string) {
    const result = await this.prisma.beneficiary.delete({
      where: { id },
    })
    if (!result) throw new NotFoundException('sorry id not found')
    return result
  }

  async removeManyBeneficiaries(ids: string[]) {
    return await this.prisma.beneficiary.deleteMany({ where: { id: { in: ids } } })
  }
}
