import { Module } from '@nestjs/common'
import { BootcampInternService } from './bootcamp-intern.service'
import { BootcampInternController } from './bootcamp-intern.controller'
import { PrismaService } from '../prisma/prisma.service'

@Module({
  controllers: [BootcampInternController],
  providers: [BootcampInternService, PrismaService],
})
export class BootcampInternModule {}
