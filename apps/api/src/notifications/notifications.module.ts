import { Module } from '@nestjs/common'
import { SendGridNotificationsProvider } from './providers/notifications.sendgrid.provider'
import { NotificationsProviderInterface } from './providers/notifications.interface.providers'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MarketingNotificationsController } from './notifications.controller'
import { EmailService } from '../email/email.service'
import { PersonService } from '../person/person.service'
import { PrismaService } from '../prisma/prisma.service'
import { MarketingNotificationsService } from './notifications.service'
import { TemplateService } from '../email/template.service'
import { CampaignService } from '../campaign/campaign.service'
import { VaultService } from '../vault/vault.service'
import { NotificationService } from '../sockets/notifications/notification.service'
import { NotificationGateway } from '../sockets/notifications/gateway'

@Module({
  imports: [ConfigModule],
  providers: [
    {
      // Use the interface as token
      provide: NotificationsProviderInterface,
      // But actually provide the service that implements the interface
      useClass: SendGridNotificationsProvider,
    },
    PrismaService,
    PersonService,
    EmailService,
    TemplateService,
    ConfigService,
    CampaignService,
    VaultService,
    NotificationService,
    NotificationGateway,
    MarketingNotificationsService,
  ],
  controllers: [MarketingNotificationsController],
  exports: [
    PrismaService,
    PersonService,
    EmailService,
    TemplateService,
    CampaignService,
    VaultService,
    NotificationService,
    NotificationGateway,
    MarketingNotificationsService,
  ],
})
export class MarketingNotificationsModule {}
