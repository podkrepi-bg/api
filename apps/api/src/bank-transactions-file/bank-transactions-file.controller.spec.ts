import { Test, TestingModule } from '@nestjs/testing'
import { CampaignService } from '../campaign/campaign.service'
import { DonationsService } from '../donations/donations.service'
import { PersonService } from '../person/person.service'
import { PrismaService } from '../prisma/prisma.service'
import { S3Service } from '../s3/s3.service'
import { VaultService } from '../vault/vault.service'
import { BankTransactionsFileController } from './bank-transactions-file.controller'
import { BankTransactionsFileService } from './bank-transactions-file.service'

describe('BankTransactionsFileController', () => {
  let controller: BankTransactionsFileController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BankTransactionsFileController],
      providers: [
        BankTransactionsFileService,
        DonationsService,
        VaultService,
        CampaignService,
        PersonService,
        PrismaService,
        S3Service
      ],
    }).compile()

    controller = module.get<BankTransactionsFileController>(BankTransactionsFileController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
