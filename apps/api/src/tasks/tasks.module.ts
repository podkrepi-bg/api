import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { DonationsModule } from '../donations/donations.module'
import { PrismaService } from '../prisma/prisma.service'
import { ImportTransactionsTask } from './import-transactions.task'

@Module({
  imports: [HttpModule, DonationsModule],
  providers: [ImportTransactionsTask, PrismaService],
})
export class TasksModule {}
