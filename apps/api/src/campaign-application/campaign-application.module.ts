import { Module } from '@nestjs/common'
import { CampaignApplicationService } from './campaign-application.service'
import { CampaignApplicationController } from './campaign-application.controller'

import { PrismaModule } from '../prisma/prisma.module'
import { OrganizerService } from '../organizer/organizer.service'
import { PersonService } from '../person/person.service'
@Module({
  imports: [PrismaModule],
  controllers: [CampaignApplicationController],
  providers: [CampaignApplicationService, OrganizerService, PersonService],
})
export class CampaignApplicationModule {}
