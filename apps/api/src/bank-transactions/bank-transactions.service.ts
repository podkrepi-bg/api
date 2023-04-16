import { Injectable } from '@nestjs/common'
import { BankDonationStatus, BankTransactionType } from '@prisma/client'
import { ExportService } from '../export/export.service'
import { getTemplateByTable } from '../export/helpers/exportableData'
import { PrismaService } from '../prisma/prisma.service'
import { Response } from 'express'

@Injectable()
export class BankTransactionsService {
  constructor(private prisma: PrismaService, private exportService: ExportService) {}

  /**
   * Lists all bank-transactions
   * @param bankDonationStatus (Optional) Filter by campaign status
   * @param type (Optional) Filter by donation type
   * @param from (Optional) Filter by creation date
   * @param to (Optional) Filter by creation date
   * @param search (Optional) Search by sender info or description
   * @param pageIndex (Optional)
   * @param pageSize (Optional)
   */
  async listBankTransactions(
    bankDonationStatus?: BankDonationStatus,
    type?: BankTransactionType,
    from?: Date,
    to?: Date,
    search?: string,
    pageIndex?: number,
    pageSize?: number,
  ) {
    const data = await this.prisma.bankTransaction.findMany({
      where: {
        bankDonationStatus,
        type,
        transactionDate: {
          gte: from,
          lte: to,
        },
        ...(search && {
          OR: [
            { senderName: { contains: search, mode: 'insensitive' } },
            { senderIban: { contains: search, mode: 'insensitive' } },
            { recipientName: { contains: search, mode: 'insensitive' } },
            { recipientIban: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      skip: pageIndex && pageSize ? pageIndex * pageSize : undefined,
      take: pageSize ? pageSize : undefined,
    })

    const count = await this.prisma.bankTransaction.count({
      where: {
        bankDonationStatus,
        type,
        transactionDate: {
          gte: from,
          lte: to,
        },
        ...(search && {
          OR: [
            { senderName: { contains: search, mode: 'insensitive' } },
            { senderIban: { contains: search, mode: 'insensitive' } },
            { recipientName: { contains: search, mode: 'insensitive' } },
            { recipientIban: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
    })

    const result = {
      items: data,
      total: count,
    }

    return result
  }

  /**
   *  @param res  - Response object to be used for the export to excel file
   */
  async exportToExcel(res: Response) {
    const { items } = await this.listBankTransactions()
    const bankTransactionsMappedForExport = items.map((trx) => ({
      ...trx,
      amount: trx.amount / 100,
    }))
    const bankTransactionsExcelTemplate = getTemplateByTable('bankTransactions')

    await this.exportService.exportToExcel(
      res,
      bankTransactionsMappedForExport,
      bankTransactionsExcelTemplate,
    )
  }
}
