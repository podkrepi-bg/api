import { Module } from '@nestjs/common'
import { CampaignModule } from '../campaign/campaign.module'
import { DonationsModule } from '../donations/donations.module'
import { BankTransactionsController } from './bank-transactions.controller'
import { BankTransactionsService } from './bank-transactions.service'
import { ConfigModule } from '@nestjs/config'
import { ExportModule } from '../export/export.module'
import { IrisTasks } from '../tasks/bank-import/import-transactions.task'
import { HttpModule } from '@nestjs/axios'
import { EmailService } from '../email/email.service'
import { TemplateService } from '../email/template.service'
import { AffiliateModule } from '../affiliate/affiliate.module'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [
    CampaignModule,
    DonationsModule,
    ConfigModule,
    ExportModule,
    HttpModule,
    AffiliateModule,
    PrismaModule,
  ],
  controllers: [BankTransactionsController],
  providers: [BankTransactionsService, IrisTasks, EmailService, TemplateService], //TODO: Create Email module to not need to import each service
  exports: [BankTransactionsService],
})
export class BankTransactionsModule {}
