import { Injectable } from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { PrismaService } from '../prisma/prisma.service'
import { Expense } from '@prisma/client';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) { }

  async createExpense(createExpenseDto: CreateExpenseDto) {
    return await this.prisma.expense.create({ data: createExpenseDto })
  }

  async listExpenses(): Promise<Expense[]> {
    return this.prisma.expense.findMany()
  }

  findOne(id: number) {
    return `This action returns a #${id} expense`;
  }

  remove(id: number) {
    return `This action removes a #${id} expense`;
  }
}
