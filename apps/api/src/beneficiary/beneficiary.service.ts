import { Beneficiary } from '.prisma/client'
import { Injectable, NotFoundException } from '@nestjs/common'
import { ExpensesService } from '../expenses/expenses.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto'
import { UpdateBeneficiaryDto } from './dto/update-beneficiary.dto'

@Injectable()
export class BeneficiaryService {
  constructor(private prisma: PrismaService, private expenses: ExpensesService) {}

  async createBeneficiary(inputDto: CreateBeneficiaryDto): Promise<Beneficiary> {
    return this.prisma.beneficiary.create({ data: inputDto.toEntity() })
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
      where: { id: id },
      data: updateBeneficiaryDto,
    })
    if (!result) throw new NotFoundException('sorry id not found')
    return result
  }

  async removeBeneficiary(id: string): Promise<Beneficiary | null> {
    const beneficiary = await this.prisma.beneficiary.findFirst({
      where: { id },
      include: { campaigns: true },
    })
    beneficiary?.campaigns.map(async (x) => {
      const vaults = await this.prisma.vault.findMany({ where: { campaignId: x.id } })
      vaults.map(async (v) => {
        const expensesToRemove = (
          await this.prisma.expense.findMany({ where: { vaultId: v.id } })
        ).map((x) => x.id)
        await this.expenses.removeMany(expensesToRemove)
        await this.prisma.vault.delete({ where: { id: v.id } }).catch(() => {})
      })
      await this.prisma.campaign.delete({ where: { id: x.id } }).catch(() => {})
    })

    const result = await this.prisma.beneficiary.delete({
      where: { id },
    })

    if (!result) throw new NotFoundException('sorry id not found')
    return result
  }
}
