import { Beneficiary } from '.prisma/client'
import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto'
import { UpdateBeneficiaryDto } from './dto/update-beneficiary.dto'

@Injectable()
export class BeneficiaryService {
  constructor(private prisma: PrismaService) {}

  async createBeneficiary(inputDto: CreateBeneficiaryDto): Promise<Beneficiary> {
    return await this.prisma.beneficiary.create({ data: inputDto })
  }

  async listBeneficiaries(): Promise<Beneficiary[]> {
    return await this.prisma.beneficiary.findMany({ include: { person: true } })
  }

  async viewBeneficiary(id: string): Promise<Beneficiary | null | undefined> {
    const beneficiary = this.prisma.beneficiary.findFirst({
      where: { id },
      include: {
        person: true,
        city: { select: { name: true } },
        company: { select: { companyName: true } },
        coordinator: { select: { person: true } },
      },
    })

    if (beneficiary == null) {
      throw new NotFoundException(`Could not find beneficiary`)
    }
    return beneficiary
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
}
