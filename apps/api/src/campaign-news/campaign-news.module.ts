import { Module } from '@nestjs/common'
import { CampaignNewsService } from './campaign-news.service'
import { CampaignNewsController } from './campaign-news.controller'
import { PrismaService } from '../prisma/prisma.service'
import { PersonService } from '../person/person.service'

@Module({
  controllers: [CampaignNewsController],
  providers: [CampaignNewsService, PersonService, PrismaService],
  exports: [CampaignNewsService],
})
export class CampaignNewsModule {}
