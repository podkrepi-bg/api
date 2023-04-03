import { Module } from '@nestjs/common'
import { ExportService } from '../export/export.service'
import { PrismaService } from '../prisma/prisma.service'
import { BankTransactionsController } from './bank-transactions.controller'
import { BankTransactionsService } from './bank-transactions.service'

@Module({
  controllers: [BankTransactionsController],
  providers: [BankTransactionsService, PrismaService, ExportService],
  exports: [BankTransactionsService],
})
export class BankTransactionsModule {}
