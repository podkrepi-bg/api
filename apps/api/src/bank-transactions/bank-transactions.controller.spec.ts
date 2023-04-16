import { Test, TestingModule } from '@nestjs/testing'
import { ExportService } from '../export/export.service'
import { MockPrismaService, prismaMock } from '../prisma/prisma-client.mock'
import { PrismaService } from '../prisma/prisma.service'
import { BankTransactionsController } from './bank-transactions.controller'
import { BankTransactionsService } from './bank-transactions.service'
import { BankDonationStatus, BankTransactionType, Currency } from '@prisma/client'

const bankTransactionsMock = [
  {
    id: '1679851630580',
    ibanNumber: 'BG27STSA93001111111111',
    bankName: 'UniCredit',
    bankIdCode: 'UNCRBGSF',
    transactionDate: new Date(Date.now()),
    senderName: 'Sender',
    recipientName: 'Recipient',
    senderIban: 'BG27STSA93001111111111',
    recipientIban: 'BG27STSA93002222222222',
    amount: -790,
    currency: Currency.BGN,
    description: 'Payment Description',
    type: BankTransactionType.debit,
    bankDonationStatus: null,
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
    bankDonationStatus: BankDonationStatus.imported,
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
]

describe('BankTransactionsController', () => {
  let controller: BankTransactionsController
  let prismaService: PrismaService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BankTransactionsController],
      providers: [BankTransactionsService, MockPrismaService, ExportService],
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
})
