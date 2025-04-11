import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '../prisma/prisma.service'
import { S3Service } from '../s3/s3.service'
import { BankTransactionsFileService } from './bank-transactions-file.service'
import { MarketingNotificationsModule } from '../notifications/notifications.module'
import { ConfigModule } from '@nestjs/config'

describe('BankTransactionsFileService', () => {
  let service: BankTransactionsFileService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [MarketingNotificationsModule, ConfigModule],
      providers: [BankTransactionsFileService, PrismaService, S3Service],
    }).compile()

    service = module.get<BankTransactionsFileService>(BankTransactionsFileService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
