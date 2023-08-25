import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common'

import { Transfer, TransferStatus } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

import { CreateTransferDto } from './dto/create-transfer.dto'
import { UpdateTransferDto } from './dto/update-transfer.dto'

@Injectable()
export class TransferService {
  constructor(private prisma: PrismaService) {}

  /**
   * Creates a transfer, while blocking the corresponding amount in the source vault.
   */
  async create(createTransferDto: CreateTransferDto): Promise<Transfer | undefined> {
    const sourceVault = await this.prisma.vault.findFirstOrThrow({
      where: {
        id: createTransferDto.sourceVaultId,
      },
    })

    if (sourceVault.amount - sourceVault.blockedAmount - createTransferDto.amount < 0) {
      throw new BadRequestException('Insufficient amount in vault.')
    }

    const writeTransfer = this.prisma.transfer.create({ data: createTransferDto })
    const writeVault = this.prisma.vault.update({
      where: { id: sourceVault.id },
      data: { blockedAmount: { increment: createTransferDto.amount } },
    })
    const [result] = await this.prisma.$transaction([writeTransfer, writeVault])
    return result
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

  /**
   * Updates a transfer, where status changes to completed/declined state will finilize the transfer and perform vault transaction between source and target.
   */
  async update(id: string, updateTransferDto: UpdateTransferDto): Promise<Transfer | null> {
    const transfer = await this.prisma.transfer.findFirstOrThrow({
      where: { id: id },
    })

    if (
      [
        TransferStatus.succeeded.valueOf(),
        TransferStatus.cancelled.valueOf(),
        TransferStatus.declined.valueOf(),
      ].includes(transfer.status.valueOf())
    ) {
      throw new BadRequestException('Transfer has already been finilized and cannot be updated')
    }
    // TODO: might need to check target vault because it doesn't make sense to update it, although it will be ok because no previous interaction has been performed
    if (
      transfer.sourceVaultId !== updateTransferDto.sourceVaultId ||
      transfer.amount !== updateTransferDto.amount
    ) {
      throw new BadRequestException(
        'Vault or amount cannot be changed, please decline the withdrawal instead.',
      )
    }

    // TODO: figure out how to initialize empty vault promise
    const srcVault = await this.prisma.vault.findFirstOrThrow({
      where: {
        id: transfer.sourceVaultId,
      },
    })
    const targetVault = await this.prisma.vault.findFirstOrThrow({
      where: {
        id: transfer.targetVaultId,
      },
    })

    let writeSrcVault = this.prisma.vault.update({
      where: { id: srcVault.id },
      data: {},
    })
    let writeTargetVault = this.prisma.vault.update({
      where: { id: targetVault.id },
      data: {},
    })
    // in case of completion: complete transaction, unblock and debit the amount to the source vault and credit the amount in the target vault
    if (updateTransferDto.status === TransferStatus.succeeded) {
      if (!updateTransferDto.approvedById) {
        throw new BadRequestException('Transfer needs to be approved by an authorized person.')
      }
      writeSrcVault = this.prisma.vault.update({
        where: { id: srcVault.id },
        data: {
          blockedAmount: { decrement: transfer.amount },
          amount: { decrement: transfer.amount },
        },
      })
      writeTargetVault = this.prisma.vault.update({
        where: { id: targetVault.id },
        data: {
          amount: { increment: transfer.amount },
        },
      })
    } else if (
      updateTransferDto.status === TransferStatus.declined ||
      updateTransferDto.status === TransferStatus.cancelled
    ) {
      // in case of rejection: unblock amount
      writeSrcVault = this.prisma.vault.update({
        where: { id: srcVault.id },
        data: { blockedAmount: { decrement: transfer.amount } },
      })
    }

    // in all other cases - only status update
    const writeTransfer = this.prisma.transfer.update({
      where: { id: id },
      data: updateTransferDto,
    })

    const [result] = await this.prisma.$transaction([
      writeTransfer,
      writeSrcVault,
      writeTargetVault,
    ])
    return result
  }

  // Functionality will be reworked soon
  async remove(id: string): Promise<Transfer | null> {
    throw new ForbiddenException()
    const result = await this.prisma.transfer.delete({ where: { id: id } })
    if (!result) throw new NotFoundException('Not found')
    return result
  }
}
