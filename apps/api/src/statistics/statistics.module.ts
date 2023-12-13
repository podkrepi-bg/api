import { Module } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { StatisticsController } from './statistics.controller'
import { StatisticsService } from './statistics.service'

@Module({
  controllers: [StatisticsController],
  providers: [StatisticsService, PrismaService],

  exports: [StatisticsService],
})
export class StatisticsModule {}
