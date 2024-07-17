import { Module } from '@nestjs/common'
import { CampaignApplicationService } from './campaign-application.service'
import { CampaignApplicationController } from './campaign-application.controller'
import { PrismaModule } from '../prisma/prisma.module'
import { PersonModule } from '../person/person.module'
import { OrganizerModule } from '../organizer/organizer.module'
@Module({
  imports: [PrismaModule, PersonModule, OrganizerModule],
  controllers: [CampaignApplicationController],
  providers: [CampaignApplicationService],
})
