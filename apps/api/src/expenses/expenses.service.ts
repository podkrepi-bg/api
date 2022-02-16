import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { CreateExpenseDto } from './dto/create-expense.dto'
import { PrismaService } from '../prisma/prisma.service'
import { Expense } from '@prisma/client'

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async createExpense(createExpenseDto: CreateExpenseDto) {
    return await this.prisma.expense.create({ data: createExpenseDto })
  }

  async listExpenses(returnDeleted = false): Promise<Expense[]> {
    return this.prisma.expense.findMany({ where: { deleted: returnDeleted } })
  }

  async findOne(id: string, returnDeleted = false) {
    try {
      const expense = await this.prisma.expense.findFirst({ where: { id, deleted: returnDeleted } })
      return expense
    } catch (error) {
      throw new NotFoundException('No expense found with that id.')
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.expense.delete({ where: { id } })
    } catch (error) {
      throw new NotFoundException('No expense with this id exists.')
    }
  }

  async removeMany(idsToDelete: string[]) {
    try {
      return await this.prisma.expense.deleteMany({
        where: {
          id: {
            in: idsToDelete,
          },
        },
      })
    } catch (err) {
      const msg = 'Delete failed. No Expense found with given ID'
      Logger.warn(msg)
      throw new NotFoundException(msg)
    }
  }
}
