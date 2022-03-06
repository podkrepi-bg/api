import { Module } from '@nestjs/common'
import { CampaignFileService } from './campaign-file.service'
import { CampaignFileController } from './campaign-file.controller'
import { PrismaService } from '../prisma/prisma.service'
import { S3Service } from '../s3/s3.service'

@Module({
  controllers: [CampaignFileController],
  providers: [CampaignFileService, PrismaService, S3Service],
})
export class CampaignFileModule {}
