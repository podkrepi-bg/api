import { Module } from '@nestjs/common'
import { OrganizerService } from './organizer.service'
import { OrganizerController } from './organizer.controller'
import { PrismaService } from '../prisma/prisma.service'

@Module({
  controllers: [OrganizerController],
  providers: [OrganizerService, PrismaService],
})
export class OrganizerModule {}
