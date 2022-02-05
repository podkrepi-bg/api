import { Module } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';

@Module({
  controllers: [ExpensesController],
  providers: [ExpensesService]
})
export class ExpensesModule {}
