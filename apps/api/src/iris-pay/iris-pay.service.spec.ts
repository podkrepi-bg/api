import { Test, TestingModule } from '@nestjs/testing'
import { IrisPayService } from './iris-pay.service'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import { PrismaService } from '../prisma/prisma.service'
import { CampaignService } from '../campaign/campaign.service'
import { DonationsService } from '../donations/donations.service'
import { PaymentStatus, PaymentProvider, Currency, DonationType } from '@prisma/client'
import { FinishPaymentDto } from './dto/finish-payment.dto'
import {
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common'

describe('IrisPayService', () => {
  let service: IrisPayService
  let donationsService: DonationsService
  let campaignService: CampaignService

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-value'),
  }

  const mockHttpService = {
    axiosRef: {
      post: jest.fn(),
      get: jest.fn(),
    },
  }

  const mockPrismaService = {
    payment: {
      findUnique: jest.fn(),
    },
    donationMetadata: {
      upsert: jest.fn().mockResolvedValue({}),
    },
    $transaction: jest.fn(),
    vault: { findFirstOrThrow: jest.fn() },
    irisCustomer: { findFirst: jest.fn(), create: jest.fn() },
  }

  const mockCampaignService = {
    getCampaignById: jest.fn(),
    validateCampaign: jest.fn(),
  }

  const mockDonationsService = {
    updateDonationPayment: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IrisPayService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: HttpService, useValue: mockHttpService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CampaignService, useValue: mockCampaignService },
        { provide: DonationsService, useValue: mockDonationsService },
      ],
    }).compile()

    service = module.get<IrisPayService>(IrisPayService)
    donationsService = module.get<DonationsService>(DonationsService)
    campaignService = module.get<CampaignService>(CampaignService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('parseIrisSum', () => {
    it('parses integer strings to minor units', () => {
      expect(service.parseIrisSum('10')).toBe(1000)
    })

    it('parses decimals with dot', () => {
      expect(service.parseIrisSum('10.50')).toBe(1050)
      expect(service.parseIrisSum('10.5')).toBe(1050)
    })

    it('parses decimals with comma', () => {
      expect(service.parseIrisSum('10,50')).toBe(1050)
    })

    it('trims whitespace', () => {
      expect(service.parseIrisSum('  10.50  ')).toBe(1050)
    })

    it('rounds half-even to nearest cent', () => {
      expect(service.parseIrisSum('10.555')).toBe(1056)
    })

    it('rejects empty, NaN, and negative', () => {
      expect(() => service.parseIrisSum('')).toThrow()
      expect(() => service.parseIrisSum('abc')).toThrow()
      expect(() => service.parseIrisSum('-1')).toThrow()
    })
  })

  describe('mapStatusToPaymentStatus', () => {
    it.each([
      ['CONFIRMED', PaymentStatus.succeeded],
      ['FAILED', PaymentStatus.declined],
      ['WAITING', PaymentStatus.waiting],
      ['UNKNOWN', PaymentStatus.waiting],
    ])('maps %s to %s', (input, expected) => {
      expect(service.mapStatusToPaymentStatus(input)).toBe(expected)
    })
  })

  describe('finalizePayment', () => {
    const paymentId = '11111111-1111-1111-1111-111111111111'
    const hookHash = 'hook-abc'
    const campaign = { id: 'camp-1', currency: Currency.BGN }

    const basePayment = {
      id: paymentId,
      extPaymentIntentId: hookHash,
      amount: 1000,
      billingName: 'John Doe',
      billingEmail: 'john@example.com',
      donations: [
        {
          id: 'don-1',
          personId: 'person-1',
          type: DonationType.donation,
          targetVault: { campaign },
          metadata: null,
        },
      ],
    }

    const baseIrisResult = {
      sum: '10.00',
      currency: 'BGN',
      status: 'CONFIRMED',
      id: 'iris-tx-1',
      payerName: 'P',
      payerIban: 'IBAN',
      payerBank: { bankHash: 'h', name: 'n', country: 'c' },
      payeeName: 'P2',
      payeeIban: 'IBAN2',
      payeeBank: { bankHash: 'h', name: 'n', country: 'c' },
      reasonForFail: '',
    }

    beforeEach(() => {
      mockPrismaService.payment.findUnique.mockResolvedValue(basePayment)
      mockHttpService.axiosRef.get.mockResolvedValue({ data: baseIrisResult })
      mockDonationsService.updateDonationPayment.mockResolvedValue('don-1')
    })

    it('throws unknown_payment when Payment row missing', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue(null)
      await expect(service.finalizePayment(paymentId)).rejects.toBeInstanceOf(NotFoundException)
    })

    it('throws iris_unavailable when verifyPayment rejects', async () => {
      mockHttpService.axiosRef.get.mockRejectedValue(new Error('network'))
      await expect(service.finalizePayment(paymentId)).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      )
    })

    it('throws currency_mismatch on currency divergence', async () => {
      mockHttpService.axiosRef.get.mockResolvedValue({
        data: { ...baseIrisResult, currency: 'EUR' },
      })
      await expect(service.finalizePayment(paymentId)).rejects.toBeInstanceOf(ConflictException)
    })

    it('uses IRIS amount even when it differs from DB amount', async () => {
      mockHttpService.axiosRef.get.mockResolvedValue({
        data: { ...baseIrisResult, sum: '15.00' },
      })
      await service.finalizePayment(paymentId)
      expect(donationsService.updateDonationPayment).toHaveBeenCalledWith(
        campaign,
        expect.objectContaining({ netAmount: 1500, chargedAmount: 1500 }),
        PaymentStatus.succeeded,
      )
    })

    it('builds PaymentData from DB (not client input) and returns status+donationId', async () => {
      const result = await service.finalizePayment(paymentId)
      expect(donationsService.updateDonationPayment).toHaveBeenCalledWith(
        campaign,
        {
          paymentIntentId: hookHash,
          netAmount: 1000,
          chargedAmount: 1000,
          currency: 'bgn',
          paymentProvider: PaymentProvider.irispay,
          billingName: 'John Doe',
          billingEmail: 'john@example.com',
          personId: 'person-1',
          type: DonationType.donation,
        },
        PaymentStatus.succeeded,
      )
      expect(result).toEqual({
        status: PaymentStatus.succeeded,
        donationId: 'don-1',
        reason: '',
      })
    })

    it('persists IRIS extra data into DonationMetadata', async () => {
      await service.finalizePayment(paymentId)
      expect(mockPrismaService.donationMetadata.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { donationId: 'don-1' },
          create: expect.objectContaining({
            donationId: 'don-1',
            extraData: expect.objectContaining({
              iris: expect.objectContaining({ irisTransactionId: 'iris-tx-1' }),
            }),
          }),
        }),
      )
    })

    it('double-fire is idempotent (service layer returns; donationsService idempotency verified elsewhere)', async () => {
      await service.finalizePayment(paymentId)
      await service.finalizePayment(paymentId)
      expect(donationsService.updateDonationPayment).toHaveBeenCalledTimes(2)
    })
  })

  describe('finishPaymentSession (deprecated, still exercised for PR 1)', () => {
    const mockCampaign = {
      id: 'campaign-123',
      currency: Currency.BGN,
    }

    const finishPaymentDto: FinishPaymentDto = {
      hookHash: 'hook-123',
      status: 'CONFIRMED',
      amount: 1000,
      billingName: 'John Doe',
      billingEmail: 'john.doe@example.com',
      metadata: {
        campaignId: 'campaign-123',
        personId: 'person-123',
        isAnonymous: 'false',
        type: 'donation',
      },
    }

    it('forwards to donationsService.updateDonationPayment', async () => {
      mockCampaignService.getCampaignById.mockResolvedValue(mockCampaign)
      mockDonationsService.updateDonationPayment.mockResolvedValue('donation-123')

      const result = await service.finishPaymentSession(finishPaymentDto)

      expect(campaignService.getCampaignById).toHaveBeenCalledWith('campaign-123')
      expect(donationsService.updateDonationPayment).toHaveBeenCalledWith(
        mockCampaign,
        expect.objectContaining({
          paymentIntentId: 'hook-123',
          netAmount: 1000,
          chargedAmount: 1000,
          currency: 'bgn',
          paymentProvider: PaymentProvider.irispay,
          personId: 'person-123',
        }),
        PaymentStatus.succeeded,
      )
      expect(result).toBe('donation-123')
    })

    it('throws when campaign not found', async () => {
      mockCampaignService.getCampaignById.mockResolvedValue(null)
      await expect(service.finishPaymentSession(finishPaymentDto)).rejects.toThrow(
        'Campaign not found: campaign-123',
      )
    })
  })
})
