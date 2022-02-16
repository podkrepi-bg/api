import { Module } from '@nestjs/common'
import { BankAccountService } from './bankaccount.service'
import { BankAccountController } from './bankaccount.controller'
import { PrismaService } from '../prisma/prisma.service'

@Module({
  controllers: [BankAccountController],
  providers: [BankAccountService, PrismaService],
})
export class BankAccountModule {}
