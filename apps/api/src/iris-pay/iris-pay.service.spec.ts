import { Test, TestingModule } from '@nestjs/testing'
import { IrisPayService } from './iris-pay.service'
import { IrisPayApiClient } from './iris-pay-api-client'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import { CampaignService } from '../campaign/campaign.service'
import { DonationsService } from '../donations/donations.service'
import { PaymentStatus, PaymentProvider, Currency, DonationType } from '@prisma/client'
import { FinishPaymentDto } from './dto/finish-payment.dto'
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common'

describe('IrisPayService', () => {
  let service: IrisPayService
  let donationsService: DonationsService
  let campaignService: CampaignService

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'APP_URL') return 'https://example.org'
      return 'test-value'
    }),
  }

  const mockIrisApi = {
    createHook: jest.fn(),
    findCustomer: jest.fn(),
    signupCustomer: jest.fn(),
    getPaymentStatus: jest.fn(),
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
        { provide: IrisPayApiClient, useValue: mockIrisApi },
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

  describe('createCustomer', () => {
    const customerDto = { email: 'john@example.com', name: 'John', family: 'Doe' }

    it('returns the userHash from IRIS when the customer is found', async () => {
      mockIrisApi.findCustomer.mockResolvedValueOnce({
        userHash: 'existing-hash',
        name: 'John',
        lastname: 'Doe',
        surname: null,
      })
      const result = await service.createCustomer(customerDto)
      expect(result).toBe('existing-hash')
      // No fallback to signup when find succeeds.
      expect(mockIrisApi.signupCustomer).not.toHaveBeenCalled()
    })

    it('falls back to signup when IRIS reports emailNotFound', async () => {
      mockIrisApi.findCustomer.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 400, data: { code: 'emailNotFound' } },
      })
      mockIrisApi.signupCustomer.mockResolvedValueOnce({ userHash: 'new-hash' })
      const result = await service.createCustomer(customerDto)
      expect(result).toBe('new-hash')
      expect(mockIrisApi.signupCustomer).toHaveBeenCalledTimes(1)
    })

    it('rethrows non-emailNotFound errors from findCustomer', async () => {
      const networkErr = new Error('boom')
      mockIrisApi.findCustomer.mockRejectedValueOnce(networkErr)
      await expect(service.createCustomer(customerDto)).rejects.toBe(networkErr)
      // signup is never attempted on unexpected check failures.
      expect(mockIrisApi.signupCustomer).not.toHaveBeenCalled()
    })

    it('throws when signup returns no userHash', async () => {
      mockIrisApi.findCustomer.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 400, data: { code: 'emailNotFound' } },
      })
      mockIrisApi.signupCustomer.mockResolvedValueOnce({})
      await expect(service.createCustomer(customerDto)).rejects.toThrow(/userHash/)
    })
  })

  describe('signPaymentId / verifySignedState', () => {
    const paymentId = '11111111-1111-1111-1111-111111111111'

    it('round-trips a paymentId through sign + verify', () => {
      const state = service.signPaymentId(paymentId)
      expect(state.startsWith(`${paymentId}.`)).toBe(true)
      expect(service.verifySignedState(state)).toBe(paymentId)
    })

    it('rejects a state with a tampered paymentId', () => {
      const state = service.signPaymentId(paymentId)
      const mac = state.split('.')[1]
      const forged = `22222222-2222-2222-2222-222222222222.${mac}`
      expect(() => service.verifySignedState(forged)).toThrow('Invalid webhook signature')
    })

    it('rejects a state with a tampered signature', () => {
      const state = service.signPaymentId(paymentId)
      const [id, mac] = state.split('.')
      const forged = `${id}.${mac.slice(0, -1)}A`
      expect(() => service.verifySignedState(forged)).toThrow('Invalid webhook signature')
    })

    it('rejects a state without a separator', () => {
      expect(() => service.verifySignedState(paymentId)).toThrow('Invalid webhook state format')
    })

    it('rejects a state of only the paymentId and empty signature', () => {
      expect(() => service.verifySignedState(`${paymentId}.`)).toThrow('Invalid webhook signature')
    })
  })

  describe('createCheckout redirect URL validation', () => {
    const baseDto = {
      email: 'john@example.com',
      name: 'John',
      family: 'Doe',
      campaignId: 'camp-1',
      amount: 1000,
      type: DonationType.donation,
      isAnonymous: false,
      billingName: 'John Doe',
      billingEmail: 'john@example.com',
    }

    it('rejects successUrl on a different host', async () => {
      await expect(
        service.createCheckout({
          ...baseDto,
          successUrl: 'https://evil.com/status?p_status=succeeded',
        }),
      ).rejects.toBeInstanceOf(BadRequestException)
      expect(mockCampaignService.getCampaignById).not.toHaveBeenCalled()
    })

    it('rejects errorUrl on a different host', async () => {
      await expect(
        service.createCheckout({
          ...baseDto,
          errorUrl: 'https://evil.com/status?p_status=failed',
        }),
      ).rejects.toBeInstanceOf(BadRequestException)
      expect(mockCampaignService.getCampaignById).not.toHaveBeenCalled()
    })

    it('rejects successUrl with a different protocol than APP_URL', async () => {
      await expect(
        service.createCheckout({
          ...baseDto,
          successUrl: 'http://example.org/status?p_status=succeeded',
        }),
      ).rejects.toBeInstanceOf(BadRequestException)
    })

    it('rejects malformed successUrl', async () => {
      await expect(
        service.createCheckout({ ...baseDto, successUrl: 'not-a-url' }),
      ).rejects.toBeInstanceOf(BadRequestException)
    })

    it('accepts a same-origin successUrl and errorUrl', async () => {
      // Validation should pass; we don't care what happens downstream here.
      mockCampaignService.getCampaignById.mockResolvedValue({ id: 'camp-1', currency: 'BGN' })
      mockCampaignService.validateCampaign.mockResolvedValue(undefined)
      mockIrisApi.findCustomer.mockResolvedValue({ userHash: 'u' })
      mockIrisApi.createHook.mockResolvedValue('hook-abc')
      mockPrismaService.$transaction.mockResolvedValue(undefined)

      // We don't assert success — just that validation didn't reject.
      const promise = service.createCheckout({
        ...baseDto,
        successUrl: 'https://example.org/campaigns/donation/camp-1/status?p_status=succeeded',
        errorUrl: 'https://example.org/campaigns/donation/camp-1/status?p_status=failed',
      })
      await expect(promise).resolves.not.toThrow()
    })

    it('accepts when both URLs are omitted', async () => {
      mockCampaignService.getCampaignById.mockResolvedValue({ id: 'camp-1', currency: 'BGN' })
      mockCampaignService.validateCampaign.mockResolvedValue(undefined)
      mockIrisApi.findCustomer.mockResolvedValue({ userHash: 'u' })
      mockIrisApi.createHook.mockResolvedValue('hook-abc')
      mockPrismaService.$transaction.mockResolvedValue(undefined)
      await expect(service.createCheckout(baseDto)).resolves.not.toThrow()
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
      mockIrisApi.getPaymentStatus.mockResolvedValue(baseIrisResult)
      mockDonationsService.updateDonationPayment.mockResolvedValue({
        id: 'don-1',
        status: PaymentStatus.succeeded,
      })
    })

    it('throws unknown_payment when Payment row missing', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue(null)
      await expect(service.finalizePayment(paymentId)).rejects.toBeInstanceOf(NotFoundException)
    })

    it("doesn't call verifyPayment if payment is already in final state", async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue({
        ...basePayment,
        status: PaymentStatus.succeeded,
        donations: [
          {
            ...basePayment.donations[0],
            metadata: { extraData: { iris: { reasonForFail: '' } } },
          },
        ],
      })
      const result = await service.finalizePayment(paymentId)
      expect(mockIrisApi.getPaymentStatus).not.toHaveBeenCalled()
      expect(donationsService.updateDonationPayment).not.toHaveBeenCalled()
      expect(mockPrismaService.donationMetadata.upsert).not.toHaveBeenCalled()
      expect(result).toEqual({
        status: PaymentStatus.succeeded,
        donationId: 'don-1',
        reason: '',
      })
    })

    it('returns the persisted reasonForFail when short-circuiting a final-state payment', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue({
        ...basePayment,
        status: PaymentStatus.cancelled,
        donations: [
          {
            ...basePayment.donations[0],
            metadata: { extraData: { iris: { reasonForFail: 'insufficient funds' } } },
          },
        ],
      })
      const result = await service.finalizePayment(paymentId)
      expect(mockIrisApi.getPaymentStatus).not.toHaveBeenCalled()
      expect(result.reason).toBe('insufficient funds')
    })

    it('calls verifyPayment when status is not yet final (waiting)', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue({
        ...basePayment,
        status: PaymentStatus.waiting,
      })
      await service.finalizePayment(paymentId)
      expect(mockIrisApi.getPaymentStatus).toHaveBeenCalled()
      expect(donationsService.updateDonationPayment).toHaveBeenCalled()
    })

    it('throws iris_unavailable when verifyPayment rejects', async () => {
      mockIrisApi.getPaymentStatus.mockRejectedValue(new Error('network'))
      await expect(service.finalizePayment(paymentId)).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      )
    })

    it('throws currency_mismatch on currency divergence', async () => {
      mockIrisApi.getPaymentStatus.mockResolvedValue({ ...baseIrisResult, currency: 'EUR' })
      await expect(service.finalizePayment(paymentId)).rejects.toBeInstanceOf(ConflictException)
    })

    it('uses IRIS amount even when it differs from DB amount', async () => {
      mockIrisApi.getPaymentStatus.mockResolvedValue({ ...baseIrisResult, sum: '15.00' })
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
      mockDonationsService.updateDonationPayment.mockResolvedValue({
        id: 'donation-123',
        status: PaymentStatus.succeeded,
      })

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
