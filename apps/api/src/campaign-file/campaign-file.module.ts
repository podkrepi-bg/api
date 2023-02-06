import { Module } from '@nestjs/common'
import { CampaignFileService } from './campaign-file.service'
import { CampaignFileController } from './campaign-file.controller'
import { PrismaService } from '../prisma/prisma.service'
import { S3Service } from '../s3/s3.service'
import { PersonService } from '../person/person.service'
import { CampaignService } from '../campaign/campaign.service'
import { VaultService } from '../vault/vault.service'
import { WebSocketModule } from './../sockets/socket.module'

@Module({
  imports: [WebSocketModule],

  controllers: [CampaignFileController],
  providers: [
    CampaignFileService,
    PrismaService,
    S3Service,
    PersonService,
    CampaignService,
    VaultService,
  ],
})
export class CampaignFileModule {}
