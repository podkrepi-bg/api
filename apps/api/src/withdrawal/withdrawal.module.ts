import { Module } from '@nestjs/common'
import { WithdrawalService } from './withdrawal.service'
import { WithdrawalController } from './withdrawal.controller'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [WithdrawalController],
  providers: [WithdrawalService],
})
export class WithdrawalModule {}
