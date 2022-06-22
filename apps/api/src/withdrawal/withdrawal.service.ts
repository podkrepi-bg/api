import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common'
import { Withdrawal, WithdrawStatus } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto'
import { UpdateWithdrawalDto } from './dto/update-withdrawal.dto'

@Injectable()
export class WithdrawalService {
  constructor(private prisma: PrismaService) {}

  async create(createWithdrawalDto: CreateWithdrawalDto): Promise<Withdrawal> {
    const vault = await this.prisma.vault.findFirst({
      where: {
        id: createWithdrawalDto.sourceVaultId,
      },
      rejectOnNotFound: true,
    })
    if (vault.amount - vault.blockedAmount - createWithdrawalDto.amount <= 0) {
      throw new BadRequestException("Insufficient amount in vault.");
    }

    const writeWth = this.prisma.withdrawal.create({ data: createWithdrawalDto });
    const writeVault = this.prisma.vault.update({
      where: { id: vault.id },
      data: { blockedAmount: vault.blockedAmount + createWithdrawalDto.amount }
    });
    const [result] = await this.prisma.$transaction([writeWth, writeVault]);
    return result;
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
    const vault = await this.prisma.vault.findFirst({
      where: {
        id: updateWithdrawalDto.sourceVaultId,
      },
      rejectOnNotFound: true,
    })
    const withdrawal = await this.prisma.withdrawal.findFirst({
      where: { id: id },
      rejectOnNotFound: true
    })

    // TODO: status check for pending -> complete or pending -> rejected

    let writeVault = this.prisma.vault.update({
      where: { id: vault.id },
      data: vault
    });
    // in case of completion: complete transaction, unblock and debit the amount
    if (updateWithdrawalDto.status === WithdrawStatus.succeeded) {
      writeVault =  this.prisma.vault.update({
        where: { id: vault.id },
        data: {blockedAmount: vault.blockedAmount - withdrawal.amount, amount: vault.amount - withdrawal.amount}
      });
    }
    else if (updateWithdrawalDto.status === WithdrawStatus.declined || updateWithdrawalDto.status === WithdrawStatus.cancelled) {
      // in case of rejection: unblock amount
      writeVault =  this.prisma.vault.update({
        where: { id: vault.id },
        data: {blockedAmount: vault.blockedAmount - withdrawal.amount}
      });
    }

    // in all other cases - only status update
    const writeWth = this.prisma.withdrawal.update({
      where: { id: id },
      data: updateWithdrawalDto,
    })

    const [result] = await this.prisma.$transaction([writeWth, writeVault]);
    return result;
  }

  async remove(id: string): Promise<Withdrawal | null> {
    const result = await this.prisma.withdrawal.delete({ where: { id: id } })
    if (!result) throw new NotFoundException('Not found')
    return result
  }
}
