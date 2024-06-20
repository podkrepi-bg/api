import { Module } from '@nestjs/common'
import { CampaignFileService } from './campaign-file.service'
import { CampaignFileController } from './campaign-file.controller'
import { S3Service } from '../s3/s3.service'
import { PersonService } from '../person/person.service'
import { CampaignService } from '../campaign/campaign.service'
import { VaultService } from '../vault/vault.service'
import { NotificationModule } from '../sockets/notifications/notification.module'
import { MarketingNotificationsModule } from '../notifications/notifications.module'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [NotificationModule, MarketingNotificationsModule, PrismaModule],

  controllers: [CampaignFileController],
  providers: [CampaignFileService, S3Service, PersonService, CampaignService, VaultService],
})
export class CampaignFileModule {}
