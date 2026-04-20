import { Test, TestingModule } from '@nestjs/testing'
import { IrisPayService } from './iris-pay.service'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import { PrismaService } from '../prisma/prisma.service'
import { CampaignService } from '../campaign/campaign.service'
import { DonationsService } from '../donations/donations.service'
import { PaymentStatus, PaymentProvider, Currency, DonationType, Prisma } from '@prisma/client'
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
    irisCustomer: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
    },
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

  describe('createCustomer', () => {
    const customerDto = { email: 'john@example.com', name: 'John', family: 'Doe' }

    it('returns the cached userHash when the customer already exists locally', async () => {
      mockPrismaService.irisCustomer.findUnique.mockResolvedValue({
        email: customerDto.email,
        userHash: 'existing-hash',
      })
      const result = await service.createCustomer(customerDto)
      expect(result).toBe('existing-hash')
      expect(mockHttpService.axiosRef.post).not.toHaveBeenCalled()
      expect(mockPrismaService.irisCustomer.create).not.toHaveBeenCalled()
    })

    it('signs up via IRIS and inserts a row when the customer is new', async () => {
      mockPrismaService.irisCustomer.findUnique.mockResolvedValue(null)
      mockHttpService.axiosRef.post.mockResolvedValue({ data: { userHash: 'new-hash' } })
      mockPrismaService.irisCustomer.create.mockResolvedValue({})
      const result = await service.createCustomer(customerDto)
      expect(result).toBe('new-hash')
      expect(mockPrismaService.irisCustomer.create).toHaveBeenCalledWith({
        data: { email: customerDto.email, userHash: 'new-hash' },
      })
    })

    it('falls back to the winning row on concurrent-insert race (P2002)', async () => {
      mockPrismaService.irisCustomer.findUnique.mockResolvedValueOnce(null)
      mockHttpService.axiosRef.post.mockResolvedValueOnce({ data: { userHash: 'loser-hash' } })
      const p2002 = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'x',
      })
      mockPrismaService.irisCustomer.create.mockRejectedValueOnce(p2002)
      mockPrismaService.irisCustomer.findUniqueOrThrow.mockResolvedValueOnce({
        email: customerDto.email,
        userHash: 'winner-hash',
      })
      const result = await service.createCustomer(customerDto)
      // Converges on the row that actually made it to the DB.
      expect(result).toBe('winner-hash')
      expect(mockPrismaService.irisCustomer.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { email: customerDto.email },
      })
    })

    it('rethrows non-P2002 Prisma errors', async () => {
      mockPrismaService.irisCustomer.findUnique.mockResolvedValueOnce(null)
      mockHttpService.axiosRef.post.mockResolvedValueOnce({ data: { userHash: 'new-hash' } })
      const otherErr = new Prisma.PrismaClientKnownRequestError('Other failure', {
        code: 'P2025',
        clientVersion: 'x',
      })
      mockPrismaService.irisCustomer.create.mockRejectedValueOnce(otherErr)
      await expect(service.createCustomer(customerDto)).rejects.toBe(otherErr)
      expect(mockPrismaService.irisCustomer.findUniqueOrThrow).not.toHaveBeenCalled()
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
      mockHttpService.axiosRef.post.mockResolvedValue({ data: { userHash: 'u' } })
      mockPrismaService.irisCustomer.findUnique.mockResolvedValue(null)
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
      mockHttpService.axiosRef.post.mockResolvedValue({ data: { userHash: 'u' } })
      mockPrismaService.irisCustomer.findUnique.mockResolvedValue(null)
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
      mockHttpService.axiosRef.get.mockResolvedValue({ data: baseIrisResult })
      mockDonationsService.updateDonationPayment.mockResolvedValue('don-1')
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
      expect(mockHttpService.axiosRef.get).not.toHaveBeenCalled()
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
      expect(mockHttpService.axiosRef.get).not.toHaveBeenCalled()
      expect(result.reason).toBe('insufficient funds')
    })

    it('calls verifyPayment when status is not yet final (waiting)', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue({
        ...basePayment,
        status: PaymentStatus.waiting,
      })
      await service.finalizePayment(paymentId)
      expect(mockHttpService.axiosRef.get).toHaveBeenCalled()
      expect(donationsService.updateDonationPayment).toHaveBeenCalled()
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
