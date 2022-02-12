import { Injectable, NotFoundException } from '@nestjs/common'
import { BankAccount } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateBankaccountDto } from './dto/create-bankaccount.dto'
import { UpdateBankaccountDto } from './dto/update-bankaccount.dto'

@Injectable()
export class BankAccountService {
  constructor(private prisma: PrismaService) {}

  async create(createBankaccountDto: CreateBankaccountDto): Promise<BankAccount> {
    return await this.prisma.bankAccount.create({ data: createBankaccountDto })
  }

  async findAll(): Promise<BankAccount[]> {
    return await this.prisma.bankAccount.findMany({ include: { withdraws: true } })
  }

  async findOne(id: string): Promise<BankAccount | null> {
    const result = await this.prisma.bankAccount.findUnique({ where: { id } })
    if (!result) throw new NotFoundException('sorry id not found')
    return result
  }

  async update(
    id: string,
    updateBankaccountDto: UpdateBankaccountDto,
  ): Promise<BankAccount | null> {
    const result = await this.prisma.bankAccount.update({
      where: { id: id },
      data: updateBankaccountDto,
    })
    if (!result) throw new NotFoundException('sorry id not found')
    return result
  }

  async remove(id: string): Promise<BankAccount | null> {
    const result = await this.prisma.bankAccount.delete({ where: { id: id } })
    if (!result) throw new NotFoundException('sorry id not found')
    return result
  }

  //DELETE MANY
  async removeMany(itemsToDelete: [string]): Promise<{ count: number }> {
    try {
      return await this.prisma.bankAccount.deleteMany({
        where: {
          id: {
            in: itemsToDelete,
          },
        },
      })
    } catch (error) {
      throw new NotFoundException()
    }
  }
}
