import { Module } from '@nestjs/common'
import { CampaignNewsFileService } from './campaign-news-file.service'
import { CampaignNewsFileController } from './campaign-news-file.controller'
import { PrismaService } from '../prisma/prisma.service'
import { S3Service } from '../s3/s3.service'
import { PersonService } from '../person/person.service'

@Module({
  controllers: [CampaignNewsFileController],
  providers: [
    CampaignNewsFileService,
    PrismaService,
    S3Service,
    PersonService,
  ],
})
export class CampaignNewsFileModule {}
