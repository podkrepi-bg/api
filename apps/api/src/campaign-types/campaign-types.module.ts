import { Module } from '@nestjs/common'
import { CampaignTypesService } from './campaign-types.service'
import { CampaignTypesController } from './campaign-types.controller'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [CampaignTypesController],
  providers: [CampaignTypesService],
})
export class CampaignTypesModule {}
