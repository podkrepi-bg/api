import { Module } from '@nestjs/common'
import { ExpensesService } from '../expenses/expenses.service'
import { PrismaService } from '../prisma/prisma.service'
import { BeneficiaryController } from './beneficiary.controller'
import { BeneficiaryService } from './beneficiary.service'

@Module({
  controllers: [BeneficiaryController],
  providers: [BeneficiaryService, PrismaService, ExpensesService],
})
export class BeneficiaryModule {}
