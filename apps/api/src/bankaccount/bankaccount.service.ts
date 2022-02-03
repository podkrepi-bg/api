import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateBankaccountDto } from './dto/create-bankaccount.dto'
import { UpdateBankaccountDto } from './dto/update-bankaccount.dto'

@Injectable()
export class BankaccountService {
  constructor(private prisma: PrismaService) {}

  async create(createBankaccountDto: CreateBankaccountDto) {
    return await this.prisma.bankAccount.create({ data: createBankaccountDto })
  }

  async findAll() {
    return await this.prisma.bankAccount.findMany()
  }

  async findOne(id: string) {
    const result = await this.prisma.bankAccount.findUnique({ where: { id: id } })
    if (!result) throw new NotFoundException('sorry id not found')
    return result
  }

  async update(id: string, updateBankaccountDto: UpdateBankaccountDto) {
    const result = await this.prisma.bankAccount.update({
      where: { id: id },
      data: updateBankaccountDto,
    })
    if (!result) throw new NotFoundException('sorry id not found')
    return result
  }

  async remove(id: string) {
    return await this.prisma.bankAccount.delete({ where: { id: id } })
  }
}
