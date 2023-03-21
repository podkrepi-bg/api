import { PrismaService } from '../prisma/prisma.service'
import { IrisIbanAccountInfo, IrisTransactionInfo } from './dto/response.dto'
import { ImportTransactionsTask } from './import-transactions.task'
import { Test, TestingModule } from '@nestjs/testing'
import { HttpModule } from '@nestjs/axios'

import { MockPrismaService, prismaMock } from '../prisma/prisma-client.mock'
import { SchedulerRegistry } from '@nestjs/schedule/dist'
import { DonationsService } from '../donations/donations.service'
import { ConfigService } from '@nestjs/config'
import { PersonService } from '../person/person.service'
import { STRIPE_CLIENT_TOKEN } from '@golevelup/nestjs-stripe'
import { CampaignService } from '../campaign/campaign.service'

import { VaultService } from '../vault/vault.service'
import { NotificationModule } from '../sockets/notifications/notification.module'
import { ExportService } from '../export/export.service'
import { BankDonationStatus, Campaign, Vault } from '@prisma/client'
import { toMoney } from '../common/money'

describe('ImportTransactionsTask', () => {
  let taskService: ImportTransactionsTask
  let prismaService: PrismaService
  let testModule: TestingModule
  let scheduler: SchedulerRegistry
  const personServiceMock = {
    findOneByKeycloakId: jest.fn(() => {
      return { id: 'mock' }
    }),
  }
  const stripeMock = {
    checkout: { sessions: { create: jest.fn() } },
  }

  const mockDonatedCampaigns = [
    {
      paymentReference: 'H92F-MHKA-BC3R',
      vaults: [{ id: 'vault-id' }],
    },
  ] as (Campaign & { vaults: Vault[] })[]

  const mockIrisTransactions: IrisTransactionInfo[] = [
    // CORRECT BANK DONATION
    {
      transactionId: 'Booked_5954782144_70123543493054963FTRO23073A58G01C2023345440_20230314',
      bookingDate: '2023-03-14',
      creditorAccount: {
        iban: 'BG66UNCR70001524349032',
      },
      creditorName: 'СДРУЖЕНИЕ ПОДКРЕПИ БГ',
      debtorAccount: {
        iban: 'BG77UNCR92900016740920',
      },
      debtorName: 'JOHN DOE',
      remittanceInformationUnstructured: 'H92F-MHKA-BC3R',
      transactionAmount: {
        amount: 50,
        currency: 'BGN',
      },
      exchangeRate: null,
      valueDate: '2023-03-14',
      creditDebitIndicator: 'CREDIT',
    },
    // WRONGED BANK DONATION
    {
      transactionId: 'Booked_5954782144_70123543493054963FTRO23073A58G01C2023345440_20230314',
      bookingDate: '2023-03-14',
      creditorAccount: {
        iban: 'BG66UNCR70001524349032',
      },
      creditorName: 'СДРУЖЕНИЕ ПОДКРЕПИ БГ',
      debtorAccount: {
        iban: 'BG77UNCR92900016740920',
      },
      debtorName: 'JOHN DOE',
      remittanceInformationUnstructured: 'WRONG_CAMPAIGN_CODE',
      transactionAmount: {
        amount: 50,
        currency: 'BGN',
      },
      exchangeRate: null,
      valueDate: '2023-03-14',
      creditDebitIndicator: 'CREDIT',
    },
    // STRIPE PAYMENT
    {
      transactionId: 'Booked_605450364_700534543545678543307503453453451C20230316302_20230316',
      bookingDate: '2023-03-16',
      creditorAccount: {
        iban: 'BG66UNCR70001524349032',
      },
      creditorName: 'СДРУЖЕНИЕ ПОДКРЕПИ БГ',
      debtorAccount: {
        iban: 'BG61CITI2150169000467',
      },
      debtorName: 'STRIPE TECHNOLOGY EUROPE LIMITED',
      remittanceInformationUnstructured: 'STRIPE',
      transactionAmount: {
        amount: 202,
        currency: 'BGN',
      },
      exchangeRate: null,
      valueDate: '2023-03-16',
      creditDebitIndicator: 'CREDIT',
    },
    // OUTGOING TRANSFER
    {
      transactionId: 'Booked_5948722409_70001522084782299L1F02306000HT01D2023030110150.01_20230301',
      bookingDate: '2023-03-01',
      creditorAccount: {
        iban: 'BG46FINV547829368931',
      },
      creditorName: 'Campaign Beneficient',
      debtorAccount: {
        iban: 'BG66UNCR70001524349032',
      },
      debtorName: 'СДРУЖЕНИЕ ПОДКРЕПИ БГ',
      remittanceInformationUnstructured: 'campaign donation',
      transactionAmount: {
        amount: -12350.09,
        currency: 'BGN',
      },
      exchangeRate: null,
      valueDate: '2023-03-01',
      creditDebitIndicator: 'DEBIT',
    },
  ]

  const irisIBANAccountMock: IrisIbanAccountInfo = {
    id: 1,
    name: 'Acc Name',
    iban: 'BG66UNCR70009994349032',
    currency: 'BGN',
    hasAuthorization: false,
    bankHash: 'bankHash',
    bankName: 'UniCredit',
    country: 'bulgaria',
    dateCreate: 1677979000000,
    consents: {
      consents: [
        {
          status: 'valid',
        },
      ],
      errorCodes: null,
    },
  }

  jest
    .spyOn(ImportTransactionsTask.prototype as any, 'checkForRequiredVariables')
    .mockImplementation(() => true)

  beforeEach(async () => {
    testModule = await Test.createTestingModule({
      imports: [HttpModule, NotificationModule],
      providers: [
        ImportTransactionsTask,
        MockPrismaService,
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
        DonationsService,
        VaultService,
        CampaignService,
        PersonService,
        ExportService,
        SchedulerRegistry,
      ],
    })
      .overrideProvider(PersonService)
      .useValue(personServiceMock)
      .compile()

    taskService = await testModule.get(ImportTransactionsTask)
    scheduler = testModule.get<SchedulerRegistry>(SchedulerRegistry)
    prismaService = prismaMock
  })

  afterEach(() => {
    jest.clearAllMocks()
    scheduler.getIntervals().forEach((el) => scheduler.deleteInterval(el))
  })

  it('should be defined', () => {
    expect(taskService).toBeDefined()
  })

  describe('initImportTransactionsTask', () => {
    it('should register the import task', async () => {
      jest.spyOn(taskService, 'initImportTransactionsTask')
      jest.spyOn(scheduler, 'addInterval')

      await taskService.initImportTransactionsTask()

      expect(scheduler.addInterval).toHaveBeenCalledWith(
        'import-bank-transactions',
        expect.anything(),
      )
      expect(scheduler.getIntervals()).toEqual(['import-bank-transactions'])
    })
  })

  describe('importBankTransactions', () => {
    it('should import IRIS transactions', async () => {
      const donationService = testModule.get<DonationsService>(DonationsService)
      const getIBANSpy = jest
        .spyOn(ImportTransactionsTask.prototype as any, 'getIrisUserIBANaccount')
        .mockImplementation(() => irisIBANAccountMock)
      const getTrxSpy = jest
        .spyOn(ImportTransactionsTask.prototype as any, 'getTransactions')
        .mockImplementation(() => mockIrisTransactions)
      const checkTrxsSpy = jest.spyOn(
        ImportTransactionsTask.prototype as any,
        'hasNewOrNonImportedTransactions',
      )

      const prepareBankTrxSpy = jest.spyOn(
        ImportTransactionsTask.prototype as any,
        'prepareBankTransactionRecords',
      )
      const processDonationsSpy = jest.spyOn(
        ImportTransactionsTask.prototype as any,
        'processDonations',
      )
      const prepareBankPaymentSpy = jest.spyOn(
        ImportTransactionsTask.prototype as any,
        'prepareBankPaymentObject',
      )
      const donationSpy = jest.spyOn(donationService, 'createUpdateBankPayment')
      const saveTrxSpy = jest.spyOn(ImportTransactionsTask.prototype as any, 'saveBankTrxRecords')

      jest.spyOn(prismaMock.bankTransaction, 'count').mockResolvedValue(mockIrisTransactions.length)
      jest.spyOn(prismaMock, '$transaction').mockResolvedValue('SUCCESS')
      jest.spyOn(prismaMock.campaign, 'findMany').mockResolvedValue(mockDonatedCampaigns)
      jest.spyOn(prismaMock.bankTransaction, 'createMany').mockResolvedValue({ count: 4 })
      jest.spyOn(prismaMock.bankTransaction, 'updateMany')

      // Run task
      await taskService.importBankTransactions()

      // 1. Should get IRIS iban account
      expect(getIBANSpy).toHaveBeenCalled()
      // 2. Should get IBAN transactions  from IRIS
      expect(getTrxSpy).toHaveBeenCalledWith(irisIBANAccountMock)
      // 3. Should check if transactions are up-to-date
      expect(checkTrxsSpy).toHaveBeenCalledWith(mockIrisTransactions)
      expect(prismaMock.bankTransaction.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: {
              in: mockIrisTransactions.map((trx) => trx.transactionId),
            },
          },
        }),
      )
      // 4.Should prepare the bank-transaction records
      expect(prepareBankTrxSpy).toHaveBeenCalledWith(mockIrisTransactions, irisIBANAccountMock)

      // 5.Should process transactions and parse donations
      expect(processDonationsSpy).toHaveBeenCalledWith(
        expect.arrayContaining(
          mockIrisTransactions.map((trx) =>
            expect.objectContaining({
              id: trx.transactionId,
              description: trx.remittanceInformationUnstructured,
              amount: toMoney(trx.transactionAmount.amount),
              transactionDate: new Date(trx.valueDate),
              type: trx.creditDebitIndicator.toLowerCase(),
            }),
          ),
        ),
      )
      expect(prismaMock.campaign.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            paymentReference: {
              in: [
                // VALID CAMPAIGN CODE
                mockIrisTransactions[0].remittanceInformationUnstructured,
                // INVALID CAMPAIGN CODE
                mockIrisTransactions[1].remittanceInformationUnstructured,
              ],
            },
          },
          include: { vaults: true },
        }),
      )
      // Should be called only once - for the recognized campaign payment ref
      expect(prepareBankPaymentSpy).toHaveBeenCalledOnce()
      expect(prepareBankPaymentSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          description: mockIrisTransactions[0].remittanceInformationUnstructured,
        }),
        expect.objectContaining({
          id: mockDonatedCampaigns[0].vaults[0].id,
        }),
      )
      expect(donationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          extPaymentIntentId: mockIrisTransactions[0].transactionId,
          targetVaultId: mockDonatedCampaigns[0].vaults[0].id,
        }),
      )

      // 6.Save trx to DB
      expect(saveTrxSpy).toHaveBeenCalledWith(
        expect.arrayContaining(
          mockIrisTransactions.map((trx) =>
            expect.objectContaining({
              id: trx.transactionId,
              description: trx.remittanceInformationUnstructured,
              amount: toMoney(trx.transactionAmount.amount),
              transactionDate: new Date(trx.valueDate),
              type: trx.creditDebitIndicator.toLowerCase(),
            }),
          ),
        ),
      )

      // Bank donation 1
      expect(saveTrxSpy.mock.calls[0][0][0].bankDonationStatus as BankDonationStatus).toEqual(
        BankDonationStatus.imported,
      )
      // Bank donation 2
      expect(saveTrxSpy.mock.calls[0][0][1].bankDonationStatus as BankDonationStatus).toEqual(
        BankDonationStatus.unrecognized,
      )
      // STRIPE Payment
      expect(
        saveTrxSpy.mock.calls[0][0][2].bankDonationStatus as BankDonationStatus,
      ).not.toBeDefined()
      // OUTGOING Payment
      expect(
        saveTrxSpy.mock.calls[0][0][3].bankDonationStatus as BankDonationStatus,
      ).not.toBeDefined()

      // Only new transactions should be saved
      expect(prismaMock.bankTransaction.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skipDuplicates: true,
        }),
      )
      // No update should be made, if all transactions were new
      expect(prismaMock.bankTransaction.updateMany).not.toHaveBeenCalled()
    })

    it('should update previously imported donations that are importing successfully', async () => {
      const getIBANSpy = jest
        .spyOn(ImportTransactionsTask.prototype as any, 'getIrisUserIBANaccount')
        .mockImplementation(() => irisIBANAccountMock)
      const getTrxSpy = jest
        .spyOn(ImportTransactionsTask.prototype as any, 'getTransactions')
        .mockImplementation(() => mockIrisTransactions)
      // return count is 3 instead of 4 - meaning 1 trx was already imported
      jest.spyOn(prismaMock.bankTransaction, 'createMany').mockResolvedValue({ count: 3 })

      jest.spyOn(prismaMock.bankTransaction, 'count').mockResolvedValue(mockIrisTransactions.length)
      jest.spyOn(prismaMock, '$transaction').mockResolvedValue('SUCCESS')
      jest.spyOn(prismaMock.campaign, 'findMany').mockResolvedValue(mockDonatedCampaigns)

      // Run task
      await taskService.importBankTransactions()

      // An update should be made
      expect(prismaMock.bankTransaction.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: {
              // Only for imported donations
              in: [mockIrisTransactions[0].transactionId],
            },
          },
          data: {
            bankDonationStatus: BankDonationStatus.imported,
          },
        }),
      )
    })

    it('should not run if no transactions have been fetched', async () => {
      const getIBANSpy = jest
        .spyOn(ImportTransactionsTask.prototype as any, 'getIrisUserIBANaccount')
        .mockImplementation(() => irisIBANAccountMock)
      const getTrxSpy = jest
        .spyOn(ImportTransactionsTask.prototype as any, 'getTransactions')
        .mockImplementation(() => [])
      const prepareBankTrxSpy = jest.spyOn(
        ImportTransactionsTask.prototype as any,
        'prepareBankTransactionRecords',
      )

      // Run task
      await taskService.importBankTransactions()

      expect(prepareBankTrxSpy).not.toHaveBeenCalled()
    })
  })
})
