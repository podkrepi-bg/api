import { Test, TestingModule } from '@nestjs/testing'
import { IrisPayService } from './iris-pay.service'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import { PrismaService } from '../prisma/prisma.service'
import { CampaignService } from '../campaign/campaign.service'
import { DonationsService } from '../donations/donations.service'
import { PaymentStatus, PaymentProvider, Currency } from '@prisma/client'
import { FinishPaymentDto } from './dto/finish-payment.dto'

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

  const mockPrismaService = {}

  const mockCampaignService = {
    getCampaignById: jest.fn(),
  }

  const mockDonationsService = {
    updateDonationPayment: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IrisPayService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CampaignService,
          useValue: mockCampaignService,
        },
        {
          provide: DonationsService,
          useValue: mockDonationsService,
        },
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

  describe('finishPaymentSession', () => {
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

    it('should successfully finish payment session', async () => {
      mockCampaignService.getCampaignById.mockResolvedValue(mockCampaign)
      mockDonationsService.updateDonationPayment.mockResolvedValue('donation-123')

      const result = await service.finishPaymentSession(finishPaymentDto)

      expect(campaignService.getCampaignById).toHaveBeenCalledWith('campaign-123')
      expect(donationsService.updateDonationPayment).toHaveBeenCalledWith(
        mockCampaign,
        {
          paymentIntentId: 'hook-123',
          netAmount: 1000,
          chargedAmount: 1000,
          currency: 'bgn',
          paymentProvider: PaymentProvider.irispay,
          billingName: 'John Doe',
          billingEmail: 'john.doe@example.com',
          personId: 'person-123',
          type: 'donation',
        },
        PaymentStatus.succeeded,
      )
      expect(result).toBe('donation-123')
    })

    it('should handle anonymous donations', async () => {
      const anonymousDto = {
        ...finishPaymentDto,
        metadata: {
          ...finishPaymentDto.metadata,
          isAnonymous: 'true' as const,
        },
      }

      mockCampaignService.getCampaignById.mockResolvedValue(mockCampaign)
      mockDonationsService.updateDonationPayment.mockResolvedValue('donation-123')

      await service.finishPaymentSession(anonymousDto)

      expect(donationsService.updateDonationPayment).toHaveBeenCalledWith(
        mockCampaign,
        expect.objectContaining({
          personId: undefined,
          billingName: 'John Doe',
          billingEmail: 'john.doe@example.com',
        }),
        PaymentStatus.succeeded,
      )
    })

    it('should handle missing billing information', async () => {
      const dtoWithoutBilling = {
        ...finishPaymentDto,
        billingName: undefined,
        billingEmail: undefined,
      }

      mockCampaignService.getCampaignById.mockResolvedValue(mockCampaign)
      mockDonationsService.updateDonationPayment.mockResolvedValue('donation-123')

      await service.finishPaymentSession(dtoWithoutBilling)

      expect(donationsService.updateDonationPayment).toHaveBeenCalledWith(
        mockCampaign,
        expect.objectContaining({
          billingName: undefined,
          billingEmail: undefined,
        }),
        PaymentStatus.succeeded,
      )
    })

    it('should throw error when campaign not found', async () => {
      mockCampaignService.getCampaignById.mockResolvedValue(null)

      await expect(service.finishPaymentSession(finishPaymentDto)).rejects.toThrow(
        'Campaign not found: campaign-123',
      )
    })

    it('should map iris-pay status values correctly', async () => {
      mockCampaignService.getCampaignById.mockResolvedValue(mockCampaign)
      mockDonationsService.updateDonationPayment.mockResolvedValue('donation-123')

      const testCases = [
        { status: 'CONFIRMED', expected: PaymentStatus.succeeded },
        { status: 'FAILED', expected: PaymentStatus.declined },
        { status: 'WAITTING', expected: PaymentStatus.waiting },
        { status: 'WAITING', expected: PaymentStatus.waiting }, // Also support correct spelling
        { status: 'UNKNOWN', expected: PaymentStatus.waiting }, // Default case
      ]

      for (const testCase of testCases) {
        const dto = { ...finishPaymentDto, status: testCase.status }
        await service.finishPaymentSession(dto)

        expect(donationsService.updateDonationPayment).toHaveBeenCalledWith(
          mockCampaign,
          expect.any(Object),
          testCase.expected,
        )
      }
    })
  })
})
