import { Module } from '@nestjs/common'
import { CampaignApplicationService } from './campaign-application.service'
import { CampaignApplicationController } from './campaign-application.controller'
import { PrismaModule } from '../prisma/prisma.module'
import { PersonService } from '../person/person.service'
import { OrganizerService } from '../organizer/organizer.service'
@Module({
  imports: [PrismaModule],
  controllers: [CampaignApplicationController],
  providers: [CampaignApplicationService,PersonService,OrganizerService],
})
export class CampaignApplicationModule {}
