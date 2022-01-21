import { Module } from '@nestjs/common'
import { TikvaService } from './tikva.service'
import { TikvaController } from './tikva.controller'
import { PrismaService } from '../prisma/prisma.service'

@Module({
  controllers: [TikvaController],
  providers: [TikvaService, PrismaService],
})
export class TikvaModule {}
