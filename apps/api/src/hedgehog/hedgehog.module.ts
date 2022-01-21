import { Module } from '@nestjs/common'
import { HedgehogService } from './hedgehog.service'
import { HedgehogController } from './hedgehog.controller'
import { PrismaService } from '../prisma/prisma.service'

@Module({
  controllers: [HedgehogController],
  providers: [HedgehogService, PrismaService],
})
export class HedgehogModule {}
