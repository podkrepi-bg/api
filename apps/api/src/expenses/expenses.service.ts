import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common'
import { Expense, ExpenseFile, ExpenseStatus } from '@prisma/client'

import { PrismaService } from '../prisma/prisma.service'
import { CreateExpenseDto } from './dto/create-expense.dto'
import { UpdateExpenseDto } from './dto/update-expense.dto'
import { CreateExpenseFileDto } from './dto/create-expense-file.dto'
import { S3Service } from '../s3/s3.service'
import { Readable } from 'stream'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService, private s3: S3Service, private readonly configService:ConfigService) { }
  
  private readonly S3_BUCKET_NAME = 'expenses-files'
  private readonly bucketName: string = this.configService.get('CAMPAIGN_APPLICATIONS_FILES_BUCKET', this.S3_BUCKET_NAME)

  /**
   * Creates an expense, while blocking the corresponding amount in the source vault.
   */
  async createExpense(createExpenseDto: CreateExpenseDto) {
    const writeExpense = this.prisma.expense.create({ data: createExpenseDto })
    const [result] = await this.prisma.$transaction([writeExpense])
    return result
  }

  async uploadFiles(expenseId: string, files: Express.Multer.File[], uploaderId: string) {
    files = files || []
    await Promise.all(
      files.map((file) => {
        //decode the name from base64
        //multi-part form data does not support utf-8 filenames
        const decodedFilename = Buffer.from(file.originalname, 'base64').toString('utf-8')
        const fileDto: CreateExpenseFileDto = {
          filename: decodedFilename,
          mimetype: file.mimetype,
          expenseId,
          uploaderId,
        }

        this.createExpenseFile(fileDto, file.buffer)
      }),
    )
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
    return await this.prisma.expense.delete({ where: { id } })
  }

  /**
   * Updates an expense, where status changes to approved/canceled state will finilize the expense and perform vault transaction.
   */
  async update(id: string, dto: UpdateExpenseDto) {
    const expense = await this.prisma.expense.findFirstOrThrow({
      where: { id: id },
    })
    if (
      [ExpenseStatus.approved.valueOf(), ExpenseStatus.canceled.valueOf()].includes(
        expense.status.valueOf(),
      )
    ) {
      throw new BadRequestException('Expense has already been finilized and cannot be updated.')
    }
    if (expense.vaultId !== dto.vaultId) {
      throw new BadRequestException('Vault or amount cannot be changed.')
    }

    const vault = await this.prisma.vault.findFirstOrThrow({
      where: {
        id: expense.vaultId,
      },
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

  async createExpenseFile(file: CreateExpenseFileDto, buffer: Buffer): Promise<string> {
    const dbFile = await this.prisma.expenseFile.create({ data: file })

    // Use the DB primary key as the S3 key. This will make sure iт is always unique.
    await this.s3.uploadObject(
      this.bucketName,
      dbFile.id,
      encodeURIComponent(file.filename),
      file.mimetype,
      buffer,
      'expenses',
      file.expenseId,
      file.uploaderId,
    )
    return dbFile.id
  }

  async listUploadedFiles(id: string): Promise<ExpenseFile[]> {
    return this.prisma.expenseFile.findMany({ where: { expenseId: id } })
  }

  async downloadFile(id: string): Promise<{
    filename: string
    mimetype: string
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

  async findUploaderId(keycloakId: string): Promise<string> {
    const person = await this.prisma.person.findFirst({ where: { keycloakId } })
    if (!person) {
      throw new NotFoundException('No person found with that login.')
    }

    return person.id
  }

  async checkCampaignOwner(keycloakId: string, vaultId: string): Promise<boolean> {
    const person = await this.prisma.person.findFirst({ where: { keycloakId } })
    if (!person) {
      Logger.warn(`No person record with keycloak ID: ${keycloakId}`)
      return false
    }

    const campaign = await this.prisma.campaign.findFirst({
      where: { organizer: { personId: person.id } },
      select: { id: true, vaults: { where: { id: vaultId } } },
    })

    if (!campaign) {
      return false
    }

    return true
  }
}
