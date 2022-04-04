import { Injectable, NotFoundException } from '@nestjs/common'

import { Transfer } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

import { CreateTransferDto } from './dto/create-transfer.dto'
import { UpdateTransferDto } from './dto/update-transfer.dto'

@Injectable()
export class TransferService {
  constructor(private prisma: PrismaService) {}

  async create(createTransferDto: CreateTransferDto): Promise<Transfer | undefined> {
    try {
      return await this.prisma.transfer.create({ data: createTransferDto })
    } catch (error) {
      throw new NotFoundException(error)
    }
  }

  async findAll(): Promise<Transfer[]> {
    return await this.prisma.transfer.findMany({
      include: {
        approvedBy: true,
        sourceCampaign: true,
        sourceVault: true,
        targetCampaign: true,
        targetVault: true,
      },
    })
  }

  async findOne(id: string): Promise<Transfer | null> {
    const result = await this.prisma.transfer.findUnique({
      where: { id },
      include: {
        approvedBy: true,
        sourceCampaign: true,
        sourceVault: true,
        targetCampaign: true,
        targetVault: true,
      },
    })
    if (!result) throw new NotFoundException('Not found')
    return result
  }

  async update(id: string, updateTransferDto: UpdateTransferDto): Promise<Transfer | null> {
    const result = await this.prisma.transfer.update({
      where: { id: id },
      data: updateTransferDto,
    })
    if (!result) throw new NotFoundException('Not found')
    return result
  }

  async remove(id: string): Promise<Transfer | null> {
    const result = await this.prisma.transfer.delete({ where: { id: id } })
    if (!result) throw new NotFoundException('Not found')
    return result
  }
}
