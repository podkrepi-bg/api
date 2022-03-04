import { Module } from '@nestjs/common'
import { BootcampSimeonService } from './bootcamp-simeon.service'
import { BootcampSimeonController } from './bootcamp-simeon.controller'
import { PrismaService } from '../prisma/prisma.service'

@Module({
  controllers: [BootcampSimeonController],
  providers: [BootcampSimeonService, PrismaService],
})
export class BootcampSimeonModule {}
