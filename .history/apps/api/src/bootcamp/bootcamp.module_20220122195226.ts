import { Module } from '@nestjs/common'

import { BootcampService } from './bootcamp.service'
import { BootcampController } from './bootcamp.controller'
import { PrismaService } from '../prisma/prisma.service'

@Module({
  controllers: [BootcampController],
  providers: [BootcampService, PrismaService],
})
export class BootcampModule {}
