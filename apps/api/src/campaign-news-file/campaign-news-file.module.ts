import { Module } from '@nestjs/common'
import { CampaignNewsFileService } from './campaign-news-file.service'
import { CampaignNewsFileController } from './campaign-news-file.controller'
import { PrismaService } from '../prisma/prisma.service'
import { S3Service } from '../s3/s3.service'
import { PersonService } from '../person/person.service'
import { CampaignService } from '../campaign/campaign.service'
import { VaultService } from '../vault/vault.service'
import { NotificationModule } from '../sockets/notifications/notification.module'

@Module({
  imports: [NotificationModule],

  controllers: [CampaignNewsFileController],
  providers: [
    CampaignNewsFileService,
    PrismaService,
    S3Service,
    PersonService,
    CampaignService,
    VaultService,
  ],
})
export class CampaignNewsFileModule {}
