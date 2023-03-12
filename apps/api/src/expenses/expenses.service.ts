import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common'
import { Expense, ExpenseFile, ExpenseStatus } from '@prisma/client'

import { PrismaService } from '../prisma/prisma.service'
import { CreateExpenseDto } from './dto/create-expense.dto'
import { UpdateExpenseDto } from './dto/update-expense.dto'
import { CreateExpenseFileDto } from './dto/create-expense-file.dto'
import { S3Service } from '../s3/s3.service'
import { Readable } from 'stream'

@Injectable()
export class ExpensesService {
  private readonly bucketName: string = 'expenses-files'
  constructor(private prisma: PrismaService, private s3: S3Service) {}

  /**
   * Creates an expense, while blocking the corresponding amount in the source vault.
   */
  async createExpense(createExpenseDto: CreateExpenseDto, files: Express.Multer.File[]) {
    const writeExpense = this.prisma.expense.create({ data: createExpenseDto })
    const [result] = await this.prisma.$transaction([writeExpense])
    return result
  }

  async uploadFiles(id: string, files: Express.Multer.File[]) {
    files = files || []
    await Promise.all(
      files.map((file) => {
        console.log("File uploading: ", id, file.filename, file.mimetype, file.originalname)
        this.create_expense_file(id, file.mimetype, file.originalname, file.buffer)
      })
    )
  }

  async listExpenses(returnDeleted = false): Promise<Expense[]> {
    return this.prisma.expense.findMany({ where: { deleted: returnDeleted } })
  }

  async listCampaignExpenses(slug: string): Promise<Expense[]> {
    return this.prisma.expense.findMany({ where:
      { vault:
        { campaign:
          { slug: slug }
        },
        deleted: false
      }
    })
  }

  async listCampaignApprovedExpenses(slug: string): Promise<Expense[]> {
    return this.prisma.expense.findMany({ where:
      { vault:
        { campaign:
          { slug: slug }
        },
        deleted: false
      },
      include: {
        expenseFiles: true
      }
    })
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
      return await this.prisma.expense.delete({ where: { id } })
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
    if (expense.vaultId !== dto.vaultId) {
      throw new BadRequestException(
        'Vault or amount cannot be changed.',
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
      data: {},
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

  async create_expense_file(
    expenseId: string,
    mimetype: string,
    filename: string,
    // uploadedBy: string,
    buffer: Buffer,
  ): Promise<string> {
    const file: CreateExpenseFileDto = {
      filename,
      mimetype,
      expenseId,
      uploaderId: '9b26b247-c275-4320-9831-fb7a0d243758' /*TODO: get user id from context*/,
    }

    const dbFile = await this.prisma.expenseFile.create({ data: file })

    // Use the DB primary key as the S3 key. This will make sure iт is always unique.
    await this.s3.uploadObject(
      this.bucketName,
      dbFile.id,
      encodeURIComponent(filename),
      mimetype,
      buffer,
      'expenses',
      expenseId,
      file.uploaderId,
    )
    return dbFile.id
  }

  async listUploadedFiles(id: string): Promise<ExpenseFile[]> {
    return this.prisma.expenseFile.findMany({ where:
      { expenseId: id }
    })
  }

  async downloadFile(id: string): Promise<{
    filename: string,
    mimetype: string,
    stream: Readable
  }> {
    const file = await this.prisma.expenseFile.findFirst({ where: { id: id } })
    if (!file) {
      Logger.warn('No expenseFile file record with ID: ' + id)
      throw new NotFoundException('No expenseFile file record with ID: ' + id)
    }
    return {
      filename: encodeURIComponent(file.filename),
      mimetype: file.mimetype,
      stream: await this.s3.streamFile(this.bucketName, id),
    }
  }

  async removeFile(id: string) {
    const file = await this.prisma.expenseFile.findFirst({ where: { id: id } })
    if (!file) {
      Logger.warn('No expenseFile file record with ID: ' + id)
      throw new NotFoundException('No expenseFile file record with ID: ' + id)
    }

    await this.s3.deleteObject(this.bucketName, id)
    await this.prisma.expenseFile.delete({ where: { id: id } })
  }
}
