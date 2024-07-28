import { Module } from '@nestjs/common'

import { TransferService } from './transfer.service'
import { TransferController } from './transfer.controller'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [TransferController],
  providers: [TransferService],
})
export class TransferModule {}
