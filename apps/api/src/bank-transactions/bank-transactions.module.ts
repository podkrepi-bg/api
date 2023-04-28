import { Module } from '@nestjs/common'
import { CampaignModule } from '../campaign/campaign.module'
import { DonationsModule } from '../donations/donations.module'
import { ExportService } from '../export/export.service'
import { PrismaService } from '../prisma/prisma.service'
import { BankTransactionsController } from './bank-transactions.controller'
import { BankTransactionsService } from './bank-transactions.service'

@Module({
  imports: [CampaignModule, DonationsModule],
  controllers: [BankTransactionsController],
  providers: [BankTransactionsService, PrismaService, ExportService],
  exports: [BankTransactionsService],
})
export class BankTransactionsModule {}
