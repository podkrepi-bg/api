import { Injectable, NotFoundException } from '@nestjs/common'
import { CreateExpenseDto } from './dto/create-expense.dto'
import { PrismaService } from '../prisma/prisma.service'
import { Expense } from '@prisma/client'

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) { }

  async createExpense(createExpenseDto: CreateExpenseDto) {
    return await this.prisma.expense.create({ data: createExpenseDto })
  }

  async listExpenses(): Promise<Expense[]> {
    return this.prisma.expense.findMany()
  }

  async findOne(id: string) {
    try {
      const expense = await this.prisma.expense.findFirst({ where: { id } });
      return expense
    } catch (error) {
      throw new NotFoundException("No expense found with that id.")
    }
  }

  remove(id: number) {
    return `This action removes a #${id} expense`
  }
}
