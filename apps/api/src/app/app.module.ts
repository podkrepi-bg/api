import { Module } from '@nestjs/common'

import { AppService } from './app.service'
import { AppController } from './app.controller'
import { CityModule } from '../city/city.module'
import { PrismaService } from '../prisma/prisma.service'
import { CampaignModule } from '../campaign/campaign.module'
import { SupportModule } from '../support/support.module'

@Module({
  imports: [CampaignModule, SupportModule, CityModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
