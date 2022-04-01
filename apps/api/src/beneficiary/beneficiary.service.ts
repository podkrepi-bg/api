import { Beneficiary } from '.prisma/client'
import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto'
import { UpdateBeneficiaryDto } from './dto/update-beneficiary.dto'
import { DeleteManyBeneficiaryDto } from './dto/delete-many-beneficiary.dto'

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
    const beneficiary = await this.prisma.beneficiary.findFirst({
      where: { id },
      include: { person: true },
    })

    if (!beneficiary) {
      Logger.warn('No beneficiary record with ID: ' + id)
      throw new NotFoundException('No beneficiary record with ID: ' + id)
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

  async removeManyBeneficiaries(data: DeleteManyBeneficiaryDto) {
    return await this.prisma.beneficiary.deleteMany({ where: { id: { in: data.ids } } })
  }
}
