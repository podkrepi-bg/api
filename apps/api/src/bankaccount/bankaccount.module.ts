import { Module } from '@nestjs/common'
import { BankAccountService } from './bankaccount.service'
import { BankAccountController } from './bankaccount.controller'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [BankAccountController],
  providers: [BankAccountService],
})
export class BankAccountModule {}
