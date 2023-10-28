import { Injectable } from '@nestjs/common'
import {
  BankDonationStatus,
  BankTransaction,
  BankTransactionType,
  Currency,
  DonationStatus,
  DonationType,
  PaymentProvider,
  Vault,
} from '@prisma/client'
import { ExportService } from '../export/export.service'
import { getTemplateByTable } from '../export/helpers/exportableData'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { Response } from 'express'
import { CreateBankPaymentDto } from '../donations/dto/create-bank-payment.dto'
import { DonationsService } from '../donations/donations.service'
import { IrisTasks } from '../tasks/bank-import/import-transactions.task'

@Injectable()
export class BankTransactionsService {
  constructor(
    private prisma: PrismaService,
    private exportService: ExportService,
    private donationService: DonationsService,
    private irisBankImport: IrisTasks,
  ) {}

  /**
   * Lists all bank-transactions
   * @param bankDonationStatus (Optional) Filter by campaign status
   * @param type (Optional) Filter by donation type
   * @param from (Optional) Filter by creation date
   * @param to (Optional) Filter by creation date
   * @param search (Optional) Search by sender info or description
   * @param pageIndex (Optional)
   * @param pageSize (Optional)
   * @param sortBy (Optional) Sort by a specific field
   * @param sortOrder (Optional) Sort order (ascending or descending)
   */
  async listBankTransactions(
    bankDonationStatus?: BankDonationStatus,
    type?: BankTransactionType,
    from?: Date,
    to?: Date,
    search?: string,
    pageIndex?: number,
    pageSize?: number,
    sortBy?: string,
    sortOrder?: string,
  ) {
    const defaultSort: Prisma.BankTransactionOrderByWithRelationInput = {
      transactionDate: 'desc',
    }

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
      orderBy: [sortBy ? { [sortBy]: sortOrder ? sortOrder : 'desc' } : defaultSort],
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

  async getBankTrxById(trxId: string) {
    const result = await this.prisma.bankTransaction.findUnique({ where: { id: trxId } })

    return result
  }

  async processDonation(bankTransaction: BankTransaction, vault: Vault, newPaymentRef: string) {
    // Transform transaction to bank-payment, so that the donation service can process it
    const bankPayment: CreateBankPaymentDto = {
      amount: bankTransaction?.amount || 0,
      currency: bankTransaction?.currency || Currency.BGN,
      extCustomerId: bankTransaction?.senderIban || '',
      extPaymentIntentId: bankTransaction?.id,
      createdAt: new Date(bankTransaction?.transactionDate),
      billingName: bankTransaction?.senderName || '',
      extPaymentMethodId: 'Manual Re-import',
      targetVaultId: vault?.id,
      type: DonationType.donation,
      status: DonationStatus.succeeded,
      provider: PaymentProvider.bank,
      personId: null,
    }

    // Execute as atomic transaction - fail/succeed as a whole
    return await this.prisma.$transaction(async (tx) => {
      // Update the status of the bank transaction
      await tx.bankTransaction.update({
        where: { id: bankTransaction.id },
        data: {
          bankDonationStatus: BankDonationStatus.reImported,
          matchedRef: newPaymentRef,
        },
      })

      // Import Donation
      await this.donationService.createUpdateBankPayment(bankPayment)
    })
  }

  async rerunBankTransactionsForDate(transactionsDate: Date) {
    await this.irisBankImport.importBankTransactionsTASK(transactionsDate)
  }
}
