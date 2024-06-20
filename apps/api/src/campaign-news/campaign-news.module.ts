import { Module } from '@nestjs/common'
import { CampaignNewsService } from './campaign-news.service'
import { CampaignNewsController } from './campaign-news.controller'
import { PersonModule } from '../person/person.module'
import { MarketingNotificationsModule } from '../notifications/notifications.module'
import { ConfigService } from '@nestjs/config'
import { EmailService } from '../email/email.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PersonModule, MarketingNotificationsModule, PrismaModule],
  controllers: [CampaignNewsController],
  providers: [CampaignNewsService, ConfigService, EmailService],
  exports: [CampaignNewsService],
})
export class CampaignNewsModule {}
