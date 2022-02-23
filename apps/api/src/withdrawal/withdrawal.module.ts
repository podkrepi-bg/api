import { Module } from '@nestjs/common';
import { WithdrawalService } from './withdrawal.service';
import { WithdrawalController } from './withdrawal.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [WithdrawalController],
  providers: [WithdrawalService, PrismaService]
})
export class WithdrawalModule {}
