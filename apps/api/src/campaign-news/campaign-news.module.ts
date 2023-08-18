import { Module } from '@nestjs/common'
import { CampaignNewsService } from './campaign-news.service'
import { CampaignNewsController } from './campaign-news.controller'
import { PrismaService } from '../prisma/prisma.service'
import { PersonModule } from '../person/person.module'
import { MarketingNotificationsModule } from '../notifications/notifications.module'
import { ConfigService } from '@nestjs/config'

@Module({
  imports: [PersonModule, MarketingNotificationsModule],
  controllers: [CampaignNewsController],
  providers: [CampaignNewsService, PrismaService, ConfigService],
  exports: [CampaignNewsService],
})
export class CampaignNewsModule {}
