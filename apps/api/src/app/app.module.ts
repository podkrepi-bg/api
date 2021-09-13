import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { AppService } from './app.service'
import { AppController } from './app.controller'
import { CityModule } from '../city/city.module'
import { PrismaService } from '../prisma/prisma.service'
import { CampaignModule } from '../campaign/campaign.module'
import { SupportModule } from '../support/support.module'
import { validationSchema } from '../config/validation.config'

@Module({
  imports: [ConfigModule.forRoot({ validationSchema }), CampaignModule, SupportModule, CityModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
