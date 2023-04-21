import { Test, TestingModule } from '@nestjs/testing'
import { ExportService } from '../export/export.service'
import { MockPrismaService, prismaMock } from '../prisma/prisma-client.mock'
import { PrismaService } from '../prisma/prisma.service'
import { BankTransactionsController } from './bank-transactions.controller'
import { BankTransactionsService } from './bank-transactions.service'
import {
  BankDonationStatus,
  BankTransactionType,
  Campaign,
  CampaignState,
  Currency,
  Vault,
} from '@prisma/client'
import { DonationsService } from '../donations/donations.service'
import { NotificationModule } from '../sockets/notifications/notification.module'
import { STRIPE_CLIENT_TOKEN } from '@golevelup/nestjs-stripe'
import { HttpModule } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { CampaignService } from '../campaign/campaign.service'
import { PersonService } from '../person/person.service'
import { VaultService } from '../vault/vault.service'

const bankTransactionsMock = [
  {
    id: '1679851630581',
    ibanNumber: 'BG27STSA93001111111111',
    bankName: 'UniCredit',
    bankIdCode: 'UNCRBGSF',
    transactionDate: new Date(Date.now()),
    senderName: 'Sender',
    recipientName: 'Recipient',
    senderIban: 'BG27STSA93002222222222',
    recipientIban: 'BG27STSA93001111111111',
    amount: 50000,
    currency: Currency.BGN,
    description: 'Campaign_Payment_Ref',
    type: BankTransactionType.credit,
    bankDonationStatus: BankDonationStatus.imported,
  },
  {
    id: '1679851630581',
    ibanNumber: 'BG27STSA93001111111111',
    bankName: 'UniCredit',
    bankIdCode: 'UNCRBGSF',
    transactionDate: new Date(Date.now()),
    senderName: 'Sender',
    recipientName: 'Recipient',
    senderIban: 'BG27STSA93002222222222',
    recipientIban: 'BG27STSA93001111111111',
    amount: 50000,
    currency: Currency.BGN,
    description: 'Campaign_Payment_Ref',
    type: BankTransactionType.credit,
    bankDonationStatus: BankDonationStatus.reImported,
  },
  {
    id: '1679851630582',
    ibanNumber: 'BG27STSA93001111111111',
    bankName: 'UniCredit',
    bankIdCode: 'UNCRBGSF',
    transactionDate: new Date(Date.now()),
    senderName: 'Sender',
    recipientName: 'Recipient',
    senderIban: 'BG27STSA93002222222222',
    recipientIban: 'BG27STSA93001111111111',
    amount: 40000,
    currency: Currency.BGN,
    description: 'WRONG_Campaign_Payment_Ref',
    type: BankTransactionType.credit,
    bankDonationStatus: BankDonationStatus.unrecognized,
  },
  {
    id: '1679851630583',
    ibanNumber: 'BG27STSA93001111111111',
    bankName: 'UniCredit',
    bankIdCode: 'UNCRBGSF',
    transactionDate: new Date(Date.now()),
    senderName: 'Sender',
    recipientName: 'Recipient',
    senderIban: 'BG27STSA93002222222222',
    recipientIban: 'BG27STSA93001111111111',
    amount: 6000,
    currency: Currency.BGN,
    description: 'WRONG_Campaign_Payment_Ref',
    type: BankTransactionType.credit,
    bankDonationStatus: BankDonationStatus.importFailed,
  },
]

const mockCampaign: Campaign & { vaults: Vault[] } = {
  id: 'testId',
  state: CampaignState.approved,
  createdAt: new Date('2022-04-08T06:36:33.661Z'),
  updatedAt: new Date('2022-04-08T06:36:33.662Z'),
  deletedAt: null,
  approvedById: null,
  paymentReference: 'payment-ref',
  vaults: [],
}

const stripeMock = {
  checkout: { sessions: { create: jest.fn() } },
}

describe('BankTransactionsController', () => {
  let controller: BankTransactionsController
  let prismaService: PrismaService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BankTransactionsController],
      imports: [HttpModule, NotificationModule],
      providers: [
        BankTransactionsService,
        MockPrismaService,
        ExportService,
        DonationsService,
        {
          provide: STRIPE_CLIENT_TOKEN,
          useValue: stripeMock,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        CampaignService,
        VaultService,
        PersonService,
      ],
    }).compile()

    controller = module.get<BankTransactionsController>(BankTransactionsController)

    prismaService = prismaMock
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('findAll ', () => {
    it('should return proper bank transactions list', async () => {
      prismaMock.bankTransaction.findMany.mockResolvedValue(bankTransactionsMock)
      prismaMock.bankTransaction.count.mockResolvedValue(bankTransactionsMock.length)

      expect(await controller.findAll()).toEqual({
        items: bankTransactionsMock,
        total: bankTransactionsMock.length,
      })
      expect(prismaService.bankTransaction.findMany).toHaveBeenCalled()
      expect(prismaService.bankTransaction.count).toHaveBeenCalled()
    })
  })

  describe('editRef ', () => {
    it('should update the campaign payment ref of a failed Bank Donation Import', async () => {
      const paymentRef = mockCampaign.paymentReference

      // Fail if transaction is already imported
      prismaMock.bankTransaction.findUnique.mockResolvedValue(bankTransactionsMock[0])
      await expect(
        controller.reImportFailedBankDonation('', { paymentRef: paymentRef }),
      ).rejects.toThrow('Bank Transaction already imported')

      // Fail if transaction is already reImported
      prismaMock.bankTransaction.findUnique.mockResolvedValue(bankTransactionsMock[1])
      await expect(
        controller.reImportFailedBankDonation('', { paymentRef: paymentRef }),
      ).rejects.toThrow('Bank Transaction already imported')

      prismaMock.campaign.findFirst.mockResolvedValue(mockCampaign)

      // Should succeed with urecognized donation
      prismaMock.bankTransaction.findUnique.mockResolvedValue(bankTransactionsMock[2])

      await expect(
        controller.reImportFailedBankDonation('', { paymentRef: paymentRef }),
      ).resolves.toEqual(
        expect.objectContaining({
          trxId: bankTransactionsMock[2].id,
          paymentRef: mockCampaign.paymentReference,
          status: BankDonationStatus.reImported,
        }),
      )

      expect(prismaService.$transaction).toHaveBeenCalled()
    })
  })
})
