import { Module } from '@nestjs/common'
import { OrganizerService } from './organizer.service'
import { OrganizerController } from './organizer.controller'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [OrganizerController],
  providers: [OrganizerService],
  exports: [OrganizerService],
})
export class OrganizerModule {}
