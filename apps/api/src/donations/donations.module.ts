import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { CampaignModule } from '../campaign/campaign.module'
import { ExportService } from '../export/export.service'
import { PersonModule } from '../person/person.module'
import { PersonService } from '../person/person.service'
import { PrismaService } from '../prisma/prisma.service'
import { VaultModule } from '../vault/vault.module'
import { VaultService } from '../vault/vault.service'
import { DonationsController } from './donations.controller'
import { DonationsService } from './donations.service'
import { HttpModule } from '@nestjs/axios'
import { ExportModule } from './../export/export.module'
import { NotificationModule } from '../sockets/notifications/notification.module'
import { MarketingNotificationsModule } from '../notifications/notifications.module'
import { EmailService } from '../email/email.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [
    VaultModule,
    CampaignModule,
    PersonModule,
    HttpModule,
    ExportModule,
    NotificationModule,
    MarketingNotificationsModule,
    ConfigModule,
    PrismaModule,
  ],
  controllers: [DonationsController],
  providers: [
    DonationsService,
    VaultService,
    PersonService,
    ExportService,
    EmailService,
  ],
  exports: [DonationsService],
})
export class DonationsModule {}
