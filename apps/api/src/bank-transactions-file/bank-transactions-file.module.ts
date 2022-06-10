import { Module } from '@nestjs/common'
import { BankTransactionsFileService } from './bank-transactions-file.service'
import { BankTransactionsFileController } from './bank-transactions-file.controller'
import { PrismaService } from '../prisma/prisma.service'
import { S3Service } from '../s3/s3.service'
import { PersonService } from '../person/person.service'


@Module({
  controllers: [BankTransactionsFileController],
  providers: [
    BankTransactionsFileService,
    PrismaService,
    S3Service,
    PersonService,
  ],
})
export class BankTransactionsFileModule {}
