import { forwardRef, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CampaignModule } from '../campaign/campaign.module'
import { CampaignService } from '../campaign/campaign.service'
import { PersonService } from '../person/person.service'
import { VaultController } from './vault.controller'
import { VaultService } from './vault.service'
import { NotificationModule } from '../sockets/notifications/notification.module'
import { MarketingNotificationsModule } from '../notifications/notifications.module'
import { PrismaModule } from '../prisma/prisma.module'
@Module({
  imports: [
    forwardRef(() => CampaignModule),
    NotificationModule,
    MarketingNotificationsModule,
    PrismaModule,
  ],

  controllers: [VaultController],
  providers: [VaultService, CampaignService, PersonService, ConfigService],
  exports: [VaultService],
})
export class VaultModule {}
