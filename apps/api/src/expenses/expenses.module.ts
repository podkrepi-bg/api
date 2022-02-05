import { Module } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ExpensesController],
  providers: [ExpensesService, PrismaService]
})
export class ExpensesModule { }
