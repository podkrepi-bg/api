import { Module } from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service'
import { SupportController } from './support.controller'
import { SupportService } from './support.service'

@Module({
  controllers: [SupportController],
  providers: [SupportService, PrismaService],
})
export class SupportModule {}
