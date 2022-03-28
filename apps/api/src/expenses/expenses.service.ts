import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { Expense } from '@prisma/client'

import { PrismaService } from '../prisma/prisma.service'
import { CreateExpenseDto } from './dto/create-expense.dto'
import { UpdateExpenseDto } from './dto/update-expense.dto'

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

  async update(id: string, data: UpdateExpenseDto) {
    try {
      return await this.prisma.expense.update({
        where: { id },
        data,
      })
    } catch (err) {
      const msg = 'Update failed. No expense record found with ID: ' + id

      Logger.warn(msg)
      throw new NotFoundException(msg)
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
