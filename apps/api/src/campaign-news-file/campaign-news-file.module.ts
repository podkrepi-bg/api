import { Module } from '@nestjs/common'
import { CampaignNewsFileService } from './campaign-news-file.service'
import { CampaignNewsFileController } from './campaign-news-file.controller'

import { S3Service } from '../s3/s3.service'
import { PersonModule } from '../person/person.module'
import { CampaignNewsModule } from '../campaign-news/campaign-news.module'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [CampaignNewsModule, PersonModule, PrismaModule],
  controllers: [CampaignNewsFileController],
  providers: [CampaignNewsFileService, S3Service],
})
export class CampaignNewsFileModule {}
