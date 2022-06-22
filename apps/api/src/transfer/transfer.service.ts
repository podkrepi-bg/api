import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'

import { Transfer } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

import { CreateTransferDto } from './dto/create-transfer.dto'
import { UpdateTransferDto } from './dto/update-transfer.dto'

@Injectable()
export class TransferService {
  constructor(private prisma: PrismaService) {}

  async create(createTransferDto: CreateTransferDto): Promise<Transfer | undefined> {
    const sourceVault = await this.prisma.vault.findFirst({
      where: {
        id: createTransferDto.sourceVaultId,
      },
      rejectOnNotFound: true,
    })

    if (sourceVault.amount - sourceVault.blockedAmount - createTransferDto.amount <= 0) {
      throw new BadRequestException("Insufficient amount in vault.");
    }

    const writeTransfer = this.prisma.transfer.create({ data: createTransferDto })
    const writeVault = this.prisma.vault.update({
      where: { id: sourceVault.id },
      data: { blockedAmount: sourceVault.blockedAmount + createTransferDto.amount }
    });
    const [result] = await this.prisma.$transaction([writeTransfer, writeVault]);
    return result;
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
