import { Module } from '@nestjs/common'
import { ExpensesService } from './expenses.service'
import { ExpensesController } from './expenses.controller'
import { PrismaService } from '../prisma/prisma.service'
import { S3Service } from '../s3/s3.service'

@Module({
  controllers: [ExpensesController],
  providers: [PrismaService, ExpensesService, S3Service],
})
export class ExpensesModule {}
