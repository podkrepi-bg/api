import { STRIPE_CLIENT_TOKEN } from '@golevelup/nestjs-stripe'
import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { CampaignService } from '../campaign/campaign.service'
import { DonationsService } from '../donations/donations.service'
import { ExportService } from '../export/export.service'
import { PersonService } from '../person/person.service'
import { PrismaService } from '../prisma/prisma.service'
import { S3Service } from '../s3/s3.service'
import { NotificationModule } from '../sockets/notifications/notification.module'
import { VaultService } from '../vault/vault.service'
import { BankTransactionsFileController } from './bank-transactions-file.controller'
import { BankTransactionsFileService } from './bank-transactions-file.service'

describe('BankTransactionsFileController', () => {
  let controller: BankTransactionsFileController
  const stripeMock = {
    checkout: { sessions: { create: jest.fn() } },
  }
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [NotificationModule],
      controllers: [BankTransactionsFileController],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: STRIPE_CLIENT_TOKEN,
          useValue: stripeMock,
        },
        BankTransactionsFileService,
        DonationsService,
        VaultService,
        CampaignService,
        PersonService,
        PrismaService,
        S3Service,
        ExportService,
      ],
    }).compile()

    controller = module.get<BankTransactionsFileController>(BankTransactionsFileController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
