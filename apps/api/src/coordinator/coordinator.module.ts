import { Module } from '@nestjs/common'
import { CoordinatorService } from './coordinator.service'
import { CoordinatorController } from './coordinator.controller'
import { PrismaService } from '../prisma/prisma.service'

@Module({
  controllers: [CoordinatorController],
  providers: [CoordinatorService, PrismaService],
})
export class CoordinatorModule {}
