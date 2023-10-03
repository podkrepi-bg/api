import { IrisIbanAccountInfo, IrisTransactionInfo } from './dto/response.dto'
import { IrisTasks } from './import-transactions.task'
import { Test, TestingModule } from '@nestjs/testing'
import { HttpModule, HttpService } from '@nestjs/axios'

import { MockPrismaService, prismaMock } from '../../prisma/prisma-client.mock'
import { SchedulerRegistry } from '@nestjs/schedule/dist'
import { DonationsService } from '../../donations/donations.service'
import { ConfigService } from '@nestjs/config'
import { PersonService } from '../../person/person.service'
import { STRIPE_CLIENT_TOKEN } from '@golevelup/nestjs-stripe'
import { CampaignService } from '../../campaign/campaign.service'

import { VaultService } from '../../vault/vault.service'
import { NotificationModule } from '../../sockets/notifications/notification.module'
import { ExportService } from '../../export/export.service'
import { BankDonationStatus, BankTransaction, Campaign, Vault } from '@prisma/client'
import { toMoney } from '../../common/money'
import { DateTime } from 'luxon'
import { EmailService } from '../../email/email.service'
import { TemplateService } from '../../email/template.service'
import { NotificationsProviderInterface } from '../../notifications/providers/notifications.interface.providers'
import { SendGridNotificationsProvider } from '../../notifications/providers/notifications.sendgrid.provider'
import { MarketingNotificationsService } from '../../notifications/notifications.service'

const IBAN = 'BG77UNCR92900016740920'

class MockIrisTasks extends IrisTasks {
  protected IBAN = IBAN
}

describe('ImportTransactionsTask', () => {
  let irisTasks: MockIrisTasks
  let testModule: TestingModule
  let scheduler: SchedulerRegistry
  let emailService: EmailService
  let httpService: HttpService
  let configService: ConfigService

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

  // Mock this before instantiating service - else it fails
  jest
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    .spyOn(IrisTasks.prototype as any, 'checkForRequiredVariables')
    .mockImplementation(() => true)

  beforeEach(async () => {
    testModule = await Test.createTestingModule({
      imports: [HttpModule, NotificationModule],
      providers: [
        MockIrisTasks,
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
        EmailService,
        TemplateService,
        {
          provide: NotificationsProviderInterface,
          useClass: SendGridNotificationsProvider,
        },
        MarketingNotificationsService,
      ],
    })
      .overrideProvider(PersonService)
      .useValue(personServiceMock)
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn(),
      })
      .compile()

    irisTasks = await testModule.get(MockIrisTasks)
    scheduler = testModule.get<SchedulerRegistry>(SchedulerRegistry)
    emailService = testModule.get<EmailService>(EmailService)
    httpService = testModule.get<HttpService>(HttpService)
    configService = testModule.get<ConfigService>(ConfigService)
  })

  afterEach(() => {
    jest.clearAllMocks()
    scheduler.getIntervals().forEach((el) => scheduler.deleteInterval(el))
  })

  it('should be defined', () => {
    expect(irisTasks).toBeDefined()
  })

  describe('importBankTransactionsTASK', () => {
    it('should import IRIS transactions', async () => {
      const donationService = testModule.get<DonationsService>(DonationsService)
      const getIBANSpy = jest
        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        .spyOn(IrisTasks.prototype as any, 'getIrisUserIBANaccount')
        .mockImplementation(() => irisIBANAccountMock)
      const getTrxSpy = jest
        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        .spyOn(IrisTasks.prototype as any, 'getTransactions')
        .mockImplementation(() => mockIrisTransactions)

      const prepareBankTrxSpy = jest.spyOn(
        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        IrisTasks.prototype as any,
        'prepareBankTransactionRecords',
      )
      const processDonationsSpy = jest.spyOn(
        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        IrisTasks.prototype as any,
        'processDonations',
      )
      const prepareBankPaymentSpy = jest.spyOn(
        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        IrisTasks.prototype as any,
        'prepareBankPaymentObject',
      )
      const donationSpy = jest.spyOn(donationService, 'createUpdateBankPayment')
      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      const saveTrxSpy = jest.spyOn(IrisTasks.prototype as any, 'saveBankTrxRecords')
      const notifyUnrecognizedSpy = jest.spyOn(
        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        IrisTasks.prototype as any,
        'sendUnrecognizedDonationsMail',
      )

      // Spy email sending
      jest.spyOn(emailService, 'sendFromTemplate').mockImplementation(async () => {})

      jest.spyOn(prismaMock.bankTransaction, 'count').mockResolvedValue(0)
      jest.spyOn(prismaMock, '$transaction').mockResolvedValue('SUCCESS')
      jest.spyOn(prismaMock.campaign, 'findMany').mockResolvedValue(mockDonatedCampaigns)
      jest.spyOn(prismaMock.bankTransaction, 'createMany').mockResolvedValue({ count: 2 })
      jest.spyOn(prismaMock.bankTransaction, 'updateMany')
      jest
        .spyOn(prismaMock.bankTransaction, 'findMany')
        .mockResolvedValue([{ id: '1' }, { id: '2' }] as BankTransaction[])

      const filteredIrisTransactions = mockIrisTransactions.filter(
        (trx) =>
          trx.remittanceInformationUnstructured !== 'STRIPE' &&
          trx.creditDebitIndicator !== 'DEBIT',
      )

      const transactionsDate = new Date()

      // Run task
      await irisTasks.importBankTransactionsTASK(transactionsDate)

      // 1. Should get IRIS iban account
      expect(getIBANSpy).toHaveBeenCalled()
      // 2. Should get IBAN transactions  from IRIS
      expect(getTrxSpy).toHaveBeenCalledWith(irisIBANAccountMock, transactionsDate)
      // 3.Should prepare the bank-transaction records
      expect(prepareBankTrxSpy).toHaveBeenCalledWith(mockIrisTransactions, irisIBANAccountMock)

      // 5.Should process transactions and parse donations
      expect(processDonationsSpy).toHaveBeenCalledWith(
        // Outgoing and Stripe payments should have been filtered
        expect.arrayContaining(
          filteredIrisTransactions.map((trx) =>
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
        // Outgoing and Stripe payments should have been filtered
        expect.arrayContaining(
          filteredIrisTransactions.map((trx) =>
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

      const parameters = saveTrxSpy.mock.calls[0][0] as BankTransaction[]

      // Bank donation 1
      expect(parameters[0].bankDonationStatus).toEqual(BankDonationStatus.imported)
      // Bank donation 2
      expect(parameters[1].bankDonationStatus).toEqual(BankDonationStatus.unrecognized)
      // STRIPE Payment
      expect(parameters[2]).not.toBeDefined()
      // OUTGOING Payment
      expect(parameters[3]).not.toBeDefined()

      // Only new transactions should be saved
      expect(prismaMock.bankTransaction.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skipDuplicates: true,
        }),
      )

      // 7.Notify for unrecognized bank donations
      expect(notifyUnrecognizedSpy).toHaveBeenCalledWith(
        // Outgoing and Stripe payments should have been filtered
        expect.arrayContaining(
          filteredIrisTransactions.map((trx) =>
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

      expect(emailService.sendFromTemplate).toHaveBeenCalled()
      // Filter the unnotified failed/unrecognized transactions
      expect(prismaMock.bankTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            bankDonationStatus: {
              in: [BankDonationStatus.importFailed, BankDonationStatus.unrecognized],
            },
            notified: false,
          }),
        }),
      )

      // Update trx notification status
      expect(prismaMock.bankTransaction.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            notified: true,
          },
        }),
      )
    })

    it('should not run if no transactions have been fetched', async () => {
      jest
        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        .spyOn(IrisTasks.prototype as any, 'getIrisUserIBANaccount')
        .mockImplementation(() => irisIBANAccountMock)
      jest
        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        .spyOn(IrisTasks.prototype as any, 'getTransactions')
        .mockImplementation(() => [])
      const prepareBankTrxSpy = jest.spyOn(
        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        IrisTasks.prototype as any,
        'prepareBankTransactionRecords',
      )

      // Run task
      await irisTasks.importBankTransactionsTASK(new Date())

      expect(prepareBankTrxSpy).not.toHaveBeenCalled()
    })

    it('should handle EUR currency and parse the BGN equivalent from the transactionId', () => {
      const eurTransaction: IrisTransactionInfo = {
        transactionId:
          'Booked_6516347588_70001524349032963FTRO23184809601C202307034024.69_20230703',
        bookingDate: '2023-07-03',
        creditorAccount: {
          iban: 'BG66UNCR70001524349032',
        },
        creditorName: 'СДРУЖЕНИЕ ПОДКРЕПИ БГ',
        debtorAccount: {
          iban: 'BG21UNCR111111111111',
        },
        debtorName: 'Name not relevant for the example',
        remittanceInformationUnstructured: '98XF-SZ50-RC8H',
        transactionAmount: {
          amount: 2069.25,
          currency: 'EUR',
        },
        exchangeRate: null,
        valueDate: '2023-07-03',
        creditDebitIndicator: 'CREDIT',
      }

      // eslint-disable-next-line
      // @ts-ignore
      const preparedTransactions = irisTasks.prepareBankTransactionRecords(
        [eurTransaction],
        irisIBANAccountMock,
      )

      expect(preparedTransactions.length).toEqual(1)
      const actual = preparedTransactions[0]

      // We expect to have converted the Amount from EUR to BGN by parsing the transaction ID
      const expected = {
        id: 'Booked_6516347588_70001524349032963FTRO23184809601C202307034024.69_20230703',
        ibanNumber: 'BG66UNCR70009994349032',
        bankName: 'UniCredit',
        transactionDate: new Date('2023-07-03T00:00:00.000Z'),
        senderName: 'Name not relevant for the example',
        recipientName: 'СДРУЖЕНИЕ ПОДКРЕПИ БГ',
        senderIban: 'BG21UNCR111111111111',
        recipientIban: 'BG66UNCR70001524349032',
        type: 'credit',
        amount: 402469,
        currency: 'BGN',
        description: '98XF-SZ50-RC8H',
        matchedRef: '98XF-SZ50-RC8H',
      }

      expect(actual).toEqual(expected)
    })

    it('should handle USD currency and parse the BGN equivalent from the transactionId', () => {
      const eurTransaction: IrisTransactionInfo = {
        transactionId: 'Booked_6516347588_70001524349032963FTRO23184809601C2023010361.12_20230103',
        bookingDate: '2023-01-03',
        creditorAccount: {
          iban: 'BG66UNCR70001524349032',
        },
        creditorName: 'СДРУЖЕНИЕ ПОДКРЕПИ БГ',
        debtorAccount: {
          iban: 'BG21UNCR111111111111',
        },
        debtorName: 'Name not relevant for the example',
        remittanceInformationUnstructured: '98XF-SZ50-RC8H',
        transactionAmount: {
          amount: 30.56,
          currency: 'USD',
        },
        exchangeRate: null,
        valueDate: '2023-01-03',
        creditDebitIndicator: 'CREDIT',
      }

      // eslint-disable-next-line
      // @ts-ignore
      const preparedTransactions = irisTasks.prepareBankTransactionRecords(
        [eurTransaction],
        irisIBANAccountMock,
      )

      expect(preparedTransactions.length).toEqual(1)
      const actual = preparedTransactions[0]

      // We expect to have converted the Amount from EUR to BGN by parsing the transaction ID
      const expected = {
        id: 'Booked_6516347588_70001524349032963FTRO23184809601C2023010361.12_20230103',
        ibanNumber: 'BG66UNCR70009994349032',
        bankName: 'UniCredit',
        transactionDate: new Date('2023-01-03T00:00:00.000Z'),
        senderName: 'Name not relevant for the example',
        recipientName: 'СДРУЖЕНИЕ ПОДКРЕПИ БГ',
        senderIban: 'BG21UNCR111111111111',
        recipientIban: 'BG66UNCR70001524349032',
        type: 'credit',
        amount: 6112,
        currency: 'BGN',
        description: '98XF-SZ50-RC8H',
        matchedRef: '98XF-SZ50-RC8H',
      }

      expect(actual).toEqual(expected)
    })

    it('should set matchedRef to null when the EUR currency amount cannot be parsed from the transaction id', () => {
      const eurTransaction: IrisTransactionInfo = {
        transactionId:
          'Booked_6516347588_70001524349032963FTRO23184809601C20230703notanumber_20230703',
        bookingDate: '2023-07-03',
        creditorAccount: {
          iban: 'BG66UNCR70001524349032',
        },
        creditorName: 'СДРУЖЕНИЕ ПОДКРЕПИ БГ',
        debtorAccount: {
          iban: 'BG21UNCR111111111111',
        },
        debtorName: 'Name not relevant for the example',
        remittanceInformationUnstructured: '98XF-SZ50-RC8H',
        transactionAmount: {
          amount: 2069.25,
          currency: 'EUR',
        },
        exchangeRate: null,
        valueDate: '2023-07-03',
        creditDebitIndicator: 'CREDIT',
      }

      // eslint-disable-next-line
      // @ts-ignore
      const preparedTransactions = irisTasks.prepareBankTransactionRecords(
        [eurTransaction],
        irisIBANAccountMock,
      )

      expect(preparedTransactions.length).toEqual(1)
      const actual = preparedTransactions[0]

      // We expect to have converted the Amount from EUR to BGN by parsing the transaction ID
      const expected = {
        id: 'Booked_6516347588_70001524349032963FTRO23184809601C20230703notanumber_20230703',
        ibanNumber: 'BG66UNCR70009994349032',
        bankName: 'UniCredit',
        transactionDate: new Date('2023-07-03T00:00:00.000Z'),
        senderName: 'Name not relevant for the example',
        recipientName: 'СДРУЖЕНИЕ ПОДКРЕПИ БГ',
        senderIban: 'BG21UNCR111111111111',
        recipientIban: 'BG66UNCR70001524349032',
        type: 'credit',
        amount: 206925,
        currency: 'EUR',
        description: '98XF-SZ50-RC8H',
        matchedRef: null,
      }

      expect(actual).toEqual(expected)
    })

    describe('extractAmountFromTransactionId', () => {
      it('can parse a whole number', () => {
        // eslint-disable-next-line
        // @ts-ignore
        const amount = irisTasks.extractAmountFromTransactionId(
          'Booked_6516347588_70001524349032963FTRO23184809601C202307032018_20230703',
          '2023-07-03',
        )

        expect(amount).toBe(2018)
      })

      it('can parse a floating number', () => {
        // eslint-disable-next-line
        // @ts-ignore
        const amount = irisTasks.extractAmountFromTransactionId(
          'Booked_6516347588_70001524349032963FTRO23184809601C202307031300.500_20230703',
          '2023-07-03',
        )

        expect(amount).toBe(1300.5)
      })

      it('can parse a zero', () => {
        // eslint-disable-next-line
        // @ts-ignore
        const amount = irisTasks.extractAmountFromTransactionId(
          'Booked_6516347588_70001524349032963FTRO23184809601C202307030_20230703',
          '2023-07-03',
        )

        expect(amount).toBe(0)
      })

      it('will not parse a negative number', () => {
        // eslint-disable-next-line
        // @ts-ignore
        const amount = irisTasks.extractAmountFromTransactionId(
          'Booked_6516347588_70001524349032963FTRO23184809601C20230703-2018_20230703',
          '2023-07-03',
        )

        expect(amount).toBe(NaN)
      })

      it('will not parse empty number', () => {
        // eslint-disable-next-line
        // @ts-ignore
        const amount = irisTasks.extractAmountFromTransactionId(
          'Booked_6516347588_70001524349032963FTRO23184809601C20230703_20230703',
          '2023-07-03',
        )

        expect(amount).toBe(NaN)
      })

      it('will not parse invalid floating number', () => {
        // eslint-disable-next-line
        // @ts-ignore
        const amount = irisTasks.extractAmountFromTransactionId(
          'Booked_6516347588_70001524349032963FTRO23184809601C20230703130.10.500_20230703',
          '2023-07-03',
        )

        expect(amount).toBe(NaN)
      })

      it('will not parse string', () => {
        // eslint-disable-next-line
        // @ts-ignore
        const amount = irisTasks.extractAmountFromTransactionId(
          'Booked_6516347588_70001524349032963FTRO23184809601C20230703test_20230703',
          '2023-07-03',
        )

        expect(amount).toBe(NaN)
      })
    })
  })

  describe('notifyForExpiringIrisConsentTASK', () => {
    it('should notify for expiring Iris Consent', async () => {
      const getIBANSpy = jest
        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        .spyOn(IrisTasks.prototype as any, 'getIrisUserIBANaccount')
        .mockImplementation(() => irisIBANAccountMock)
      const getConsentLinkSpy = jest
        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        .spyOn(IrisTasks.prototype as any, 'getConsentLink')
        .mockImplementation(() => 'consent-link.com')

      // Spy email sending
      jest.spyOn(emailService, 'sendFromTemplate').mockImplementation(async () => {})
      // Mock Config
      jest.spyOn(configService, 'get').mockReturnValue('www.link.com/{ibanID}')

      const httpSpy = jest.spyOn(httpService.axiosRef, 'get').mockResolvedValue({
        data: {
          consents: [
            {
              iban: IBAN,
              status: 'valid',
              validUntil: DateTime.now().plus({ days: 3 }).toFormat('yyyy-MM-dd'),
            },
            {
              iban: IBAN,
              status: 'expired',
              validUntil: DateTime.now().minus({ days: 3 }).toFormat('yyyy-MM-dd'),
            },
          ],
        },
      })

      // Run task
      await irisTasks.notifyForExpiringIrisConsentTASK()

      // 1. Get IBAN Account Info
      expect(getIBANSpy).toHaveBeenCalled()

      // 2. Get the consent info for the IBAN
      expect(httpSpy).toHaveBeenCalled()

      // 3 < 5 => notify for expiring consent
      expect(getConsentLinkSpy).toHaveBeenCalled()

      expect(emailService.sendFromTemplate).toHaveBeenCalled()
    })
  })

  it('should NOT notify for expiring Iris Consent before expTreshold is met', async () => {
    const getIBANSpy = jest
      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      .spyOn(IrisTasks.prototype as any, 'getIrisUserIBANaccount')
      .mockImplementation(() => irisIBANAccountMock)
    const getConsentLinkSpy = jest
      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      .spyOn(IrisTasks.prototype as any, 'getConsentLink')
      .mockImplementation(() => 'consent-link.com')

    // Spy email sending
    jest.spyOn(emailService, 'sendFromTemplate').mockImplementation(async () => {})
    // Mock Config
    jest.spyOn(configService, 'get').mockReturnValue('www.link.com/{ibanID}')

    const httpSpy = jest.spyOn(httpService.axiosRef, 'get').mockResolvedValue({
      data: {
        consents: [
          {
            iban: IBAN,
            status: 'valid',
            validUntil: DateTime.now().plus({ days: 6 }).toFormat('yyyy-MM-dd'),
          },
        ],
      },
    })

    // Run task
    await irisTasks.notifyForExpiringIrisConsentTASK()

    // 1. Get IBAN Account Info
    expect(getIBANSpy).toHaveBeenCalled()

    // 2. Get the consent info for the IBAN
    expect(httpSpy).toHaveBeenCalled()

    // 6 > 5 => don't notify for expiring consent
    expect(getConsentLinkSpy).not.toHaveBeenCalled()
    expect(emailService.sendFromTemplate).not.toHaveBeenCalled()
  })
})
