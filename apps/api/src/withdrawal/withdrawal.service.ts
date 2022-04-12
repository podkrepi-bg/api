import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { Withdrawal } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto'
import { UpdateWithdrawalDto } from './dto/update-withdrawal.dto'

@Injectable()
export class WithdrawalService {
  constructor(private prisma: PrismaService) {}

  async create(CreateWithdrawalDto: CreateWithdrawalDto): Promise<Withdrawal> {
    return await this.prisma.withdrawal.create({ data: CreateWithdrawalDto })
  }

  async findAll(): Promise<Withdrawal[]> {
    return await this.prisma.withdrawal.findMany({
      include: { bankAccount: true, approvedBy: true, sourceCampaign: true, sourceVault: true },
    })
  }

  async findOne(id: string): Promise<Withdrawal | null> {
    const result = await this.prisma.withdrawal.findFirst({
      where: { id },
      include: { bankAccount: true, approvedBy: true, sourceCampaign: true, sourceVault: true },
    })
    if (!result) {
      Logger.warn('No withdrawal record with ID: ' + id)
      throw new NotFoundException('No withdrawal record with ID: ' + id)
    }
    return result
  }

  async update(id: string, updateWithdrawalDto: UpdateWithdrawalDto): Promise<Withdrawal | null> {
    const result = await this.prisma.withdrawal.update({
      where: { id: id },
      data: updateWithdrawalDto,
    })
    if (!result) throw new NotFoundException('Not found')
    return result
  }

  async remove(id: string): Promise<Withdrawal | null> {
    const result = await this.prisma.withdrawal.delete({ where: { id: id } })
    if (!result) throw new NotFoundException('Not found')
    return result
  }
}
