import { Module } from '@nestjs/common'
import { CampaignNewsService } from './campaign-news.service'
import { CampaignNewsController } from './campaign-news.controller'
import { PrismaService } from '../prisma/prisma.service'
import { PersonModule } from '../person/person.module'

@Module({
  imports: [PersonModule],
  controllers: [CampaignNewsController],
  providers: [CampaignNewsService, PrismaService],
  exports: [CampaignNewsService],
})
export class CampaignNewsModule {}
