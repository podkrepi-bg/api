import { StripeModule } from '@golevelup/nestjs-stripe'
import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { StripeConfigFactory } from './helpers/stripe-config-factory'
import { CampaignModule } from '../campaign/campaign.module'
import { CampaignService } from '../campaign/campaign.service'
import { RecurringDonationService } from '../recurring-donation/recurring-donation.service'
import { ExportService } from '../export/export.service'
import { PersonModule } from '../person/person.module'
import { PersonService } from '../person/person.service'
import { PrismaService } from '../prisma/prisma.service'
import { VaultModule } from '../vault/vault.module'
import { VaultService } from '../vault/vault.service'
import { DonationsController } from './donations.controller'
import { DonationsService } from './donations.service'
import { StripePaymentService } from './events/stripe-payment.service'
import { HttpModule } from '@nestjs/axios'
import { ExportModule } from './../export/export.module'
import { NotificationModule } from '../sockets/notifications/notification.module'
import { MarketingNotificationsModule } from '../notifications/notifications.module'
import { EmailService } from '../email/email.service'

@Module({
  imports: [
    StripeModule.forRootAsync(StripeModule, {
      inject: [ConfigService],
      useFactory: StripeConfigFactory.useFactory,
    }),
    VaultModule,
    CampaignModule,
    PersonModule,
    HttpModule,
    ExportModule,
    NotificationModule,
    MarketingNotificationsModule,
  ],
  controllers: [DonationsController],
  providers: [
    DonationsService,
    StripePaymentService,
    CampaignService,
    RecurringDonationService,
    PrismaService,
    VaultService,
    PersonService,
    ExportService,
    EmailService,
  ],
  exports: [DonationsService],
})
export class DonationsModule {}
