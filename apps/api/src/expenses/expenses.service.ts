import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common'
import { Expense, ExpenseStatus } from '@prisma/client'

import { PrismaService } from '../prisma/prisma.service'
import { CreateExpenseDto } from './dto/create-expense.dto'
import { UpdateExpenseDto } from './dto/update-expense.dto'

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Creates an expense, while blocking the corresponding amount in the source vault.
   */
  async createExpense(createExpenseDto: CreateExpenseDto) {
    const sourceVault = await this.prisma.vault.findFirst({
      where: {
        id: createExpenseDto.vaultId,
      },
      rejectOnNotFound: true,
    })

    if (sourceVault.amount - sourceVault.blockedAmount - createExpenseDto.amount <= 0) {
      throw new BadRequestException('Insufficient amount in vault.')
    }

    const writeExpense = this.prisma.expense.create({ data: createExpenseDto })
    const writeVault = this.prisma.vault.update({
      where: { id: sourceVault.id },
      data: { blockedAmount: { increment: createExpenseDto.amount } },
    })
    const [result] = await this.prisma.$transaction([writeExpense, writeVault])
    return result
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

  // Functionality will be reworked soon
  async remove(id: string) {
    throw new ForbiddenException()
    try {
      return await this.prisma.expense.delete({ where: { id } })
    } catch (error) {
      throw new NotFoundException('No expense with this id exists.')
    }
  }

  /**
   * Updates an expense, where status changes to approved/canceled state will finilize the expense and perform vault transaction.
   */
  async update(id: string, dto: UpdateExpenseDto) {
    const expense = await this.prisma.expense.findFirst({
      where: { id: id },
      rejectOnNotFound: true,
    })
    if (
      [ExpenseStatus.approved.valueOf(), ExpenseStatus.canceled.valueOf()]
      .includes(expense.status.valueOf())
    ) {
      throw new BadRequestException('Expense has already been finilized and cannot be updated.')
    }
    if (expense.vaultId !== dto.vaultId || expense.amount !== dto.amount) {
      throw new BadRequestException(
        'Vault or amount cannot be changed, please decline the withdrawal instead.',
      )
    }

    const vault = await this.prisma.vault.findFirst({
      where: {
        id: expense.vaultId,
      },
      rejectOnNotFound: true,
    })

    // TODO: figure out how to initialize empty vault promise
    let writeVault = this.prisma.vault.update({
      where: { id: vault.id },
      data: vault,
    })
    // in case of completion: complete transaction, unblock and debit the amount
    if (dto.status === ExpenseStatus.approved) {
      if (!dto.approvedById) {
        throw new BadRequestException('Expense needs to be approved by an authorized person.')
      }
      writeVault = this.prisma.vault.update({
        where: { id: vault.id },
        data: {
          blockedAmount: { decrement: expense.amount },
          amount: { decrement: expense.amount },
        },
      })
    } else if (dto.status === ExpenseStatus.canceled) {
      // in case of rejection: unblock amount
      writeVault = this.prisma.vault.update({
        where: { id: vault.id },
        data: { blockedAmount: { decrement: expense.amount } },
      })
    }

    // in all other cases - only status update
    const writeExpense = this.prisma.expense.update({
      where: { id: id },
      data: dto,
    })

    const [result] = await this.prisma.$transaction([writeExpense, writeVault])
    return result
  }
}
