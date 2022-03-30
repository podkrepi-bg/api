import { Module } from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service'

import { TransferService } from './transfer.service'
import { TransferController } from './transfer.controller'

@Module({
  controllers: [TransferController],
  providers: [TransferService, PrismaService],
})
export class TransferModule {}
