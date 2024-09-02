import { Module } from '@nestjs/common'
import { CoordinatorService } from './coordinator.service'
import { CoordinatorController } from './coordinator.controller'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [CoordinatorController],
  providers: [CoordinatorService],
})
export class CoordinatorModule {}
