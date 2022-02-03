import { Module } from '@nestjs/common'
import { BankaccountService } from './bankaccount.service'
import { BankaccountController } from './bankaccount.controller'
import { PrismaService } from '../prisma/prisma.service'

@Module({
  controllers: [BankaccountController],
  providers: [BankaccountService, PrismaService],
})
export class BankaccountModule {}
