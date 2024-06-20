import { Module } from '@nestjs/common'
import { BankTransactionsFileService } from './bank-transactions-file.service'
import { BankTransactionsFileController } from './bank-transactions-file.controller'
import { S3Service } from '../s3/s3.service'
import { PersonService } from '../person/person.service'
import { DonationsService } from '../donations/donations.service'
import { VaultService } from '../vault/vault.service'
import { CampaignService } from '../campaign/campaign.service'
import { ConfigService } from '@nestjs/config'
import { StripeModule } from '@golevelup/nestjs-stripe'
import { StripeConfigFactory } from '../donations/helpers/stripe-config-factory'
import { ExportService } from '../export/export.service'
import { NotificationModule } from '../sockets/notifications/notification.module'
import { MarketingNotificationsModule } from '../notifications/notifications.module'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [
    StripeModule.forRootAsync(StripeModule, {
      inject: [ConfigService],
      useFactory: StripeConfigFactory.useFactory,
    }),
    NotificationModule,
    MarketingNotificationsModule,
    PrismaModule,
  ],
  controllers: [BankTransactionsFileController],
  providers: [
    BankTransactionsFileService,
    S3Service,
    PersonService,
    VaultService,
    CampaignService,
    DonationsService,
    ExportService,
  ],
})
export class BankTransactionsFileModule {}
