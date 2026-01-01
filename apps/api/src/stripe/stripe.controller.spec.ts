import {
  StripeModule as GoLevelUpStripeModule,
  STRIPE_CLIENT_TOKEN,
  StripeModuleConfig,
} from '@golevelup/nestjs-stripe'
import { Test, TestingModule } from '@nestjs/testing'
import { StripeController } from './stripe.controller'
import { StripeService } from './stripe.service'
import { MockPrismaService, prismaMock } from '../prisma/prisma-client.mock'
import { PrismaService } from '../prisma/prisma.service'
import { Campaign, CampaignState, Currency } from '@prisma/client'
import {
  ConvertSubscriptionsCurrencyDto,
  ConvertSingleSubscriptionCurrencyDto,
} from './dto/currency-conversion.dto'
import { CreateSessionDto } from '../donations/dto/create-session.dto'
import { forwardRef, NotAcceptableException } from '@nestjs/common'
import { PersonService } from '../person/person.service'
import { CampaignService } from '../campaign/campaign.service'
import { MarketingNotificationsService } from '../notifications/notifications.service'
import { ConfigService } from 'aws-sdk'
import { ConfigModule } from '@nestjs/config'
import { MarketingNotificationsModule } from '../notifications/notifications.module'
import { RecurringDonationModule } from '../recurring-donation/recurring-donation.module'

import { EmailService } from '../email/email.service'

import { TemplateService } from '../email/template.service'
import { DonationsService } from '../donations/donations.service'
import { VaultService } from '../vault/vault.service'
import { ExportService } from '../export/export.service'
import { NotificationModule } from '../sockets/notifications/notification.module'

import { KeycloakTokenParsed } from '../auth/keycloak'
import { PrismaModule } from '../prisma/prisma.module'
import { RecurringDonationService } from '../recurring-donation/recurring-donation.service'
describe('StripeController', () => {
  let controller: StripeController
  let stripeService: StripeService
  const stripeMock = {
    checkout: { sessions: { create: jest.fn() } },
    paymentIntents: { retrieve: jest.fn() },
    refunds: { create: jest.fn() },
    setupIntents: { retrieve: jest.fn(), update: jest.fn() },
    customers: { create: jest.fn(), list: jest.fn() },
    paymentMethods: { attach: jest.fn() },
    products: { search: jest.fn(), create: jest.fn() },
    subscriptions: { create: jest.fn(), retrieve: jest.fn(), update: jest.fn(), list: jest.fn() },
  }
  stripeMock.checkout.sessions.create.mockResolvedValue({ payment_intent: 'unique-intent' })
  stripeMock.paymentIntents.retrieve.mockResolvedValue({
    payment_intent: 'unique-intent',
    metadata: { campaignId: 'unique-campaign' },
  })
  stripeMock.products.search.mockResolvedValue({ data: [{ id: 1 }] })
  stripeMock.subscriptions.create.mockResolvedValue({
    id: 'sub_test123',
    latest_invoice: {
      payments: {
        data: [
          {
            payment: {
              payment_intent: 'pi_test123',
            },
          },
        ],
      },
    },
  })

  stripeMock.setupIntents.retrieve.mockResolvedValue({
    payment_intent: 'unique-intent',
    metadata: { campaignId: 'unique-campaign', amount: 100, currency: 'EUR' },
    payment_method: {
      billing_details: {
        email: 'test@podkrepi.bg',
      },
    },
  })

  stripeMock.customers.list.mockResolvedValue({ data: [{ id: 1 }] })

  const mockSession = {
    mode: 'payment',
    amount: 100,
    campaignId: 'testCampaignId',
    successUrl: 'http://test.com',
    cancelUrl: 'http://test.com',
    isAnonymous: true,
  } as CreateSessionDto

  beforeEach(async () => {
    jest.clearAllMocks()

    Object.values(prismaMock).forEach((modelMock) =>
      Object.values(modelMock).forEach((methodMock) => (methodMock as any).mockReset?.()),
    )

    const stripeSecret = 'wh_123'
    const moduleConfig: StripeModuleConfig = {
      apiKey: stripeSecret,
      webhookConfig: {
        stripeSecrets: {
          account: stripeSecret,
        },
        loggingConfiguration: {
          logMatchingEventHandlers: true,
        },
      },
    }

    jest.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        GoLevelUpStripeModule.forRootAsync({
          useFactory: () => moduleConfig,
        }),
        MarketingNotificationsModule,
        NotificationModule,
      ],
      controllers: [StripeController],
      providers: [
        EmailService,
        TemplateService,
        VaultService,
        ExportService,
        DonationsService,
        CampaignService,
        PersonService,
        StripeService,
        RecurringDonationService,
        MockPrismaService,
        {
          provide: STRIPE_CLIENT_TOKEN,
          useValue: stripeMock,
        },
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile()

    controller = module.get<StripeController>(StripeController)
    stripeService = module.get<StripeService>(StripeService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
  afterEach(() => {
    jest.clearAllMocks()
  })
  it('createCheckoutSession should create stripe session for active campaign', async () => {
    prismaMock.campaign.findFirst.mockResolvedValue({
      id: 'active-campaign',
      allowDonationOnComplete: false,
      state: CampaignState.active,
    } as Campaign)

    await expect(controller.createCheckoutSession(mockSession)).resolves.toBeObject()
    expect(prismaMock.campaign.findFirst).toHaveBeenCalled()
    expect(stripeMock.checkout.sessions.create).toHaveBeenCalledWith({
      mode: mockSession.mode,
      line_items: [
        {
          price_data: {
            currency: undefined,
            product_data: {
              name: undefined,
            },
            unit_amount: 100,
          },
          quantity: 1,
        },
      ],
      payment_method_types: ['card'],
      payment_intent_data: {
        metadata: {
          campaignId: mockSession.campaignId,
          isAnonymous: 'true',
          personId: undefined,
          wish: null,
        },
      },
      subscription_data: undefined,
      success_url: mockSession.successUrl,
      cancel_url: mockSession.cancelUrl,
      customer_email: undefined,
      tax_id_collection: {
        enabled: true,
      },
    })
  })

  it('createCheckoutSession should not create stripe session for completed campaign', async () => {
    prismaMock.campaign.findFirst.mockResolvedValue({
      id: 'complete-campaign',
      allowDonationOnComplete: false,
      state: CampaignState.complete,
    } as Campaign)

    await expect(controller.createCheckoutSession(mockSession)).rejects.toThrow(
      new NotAcceptableException('Campaign cannot accept donations in state: complete'),
    )

    expect(prismaMock.campaign.findFirst).toHaveBeenCalled()
    expect(stripeMock.checkout.sessions.create).not.toHaveBeenCalled()
  })

  it('createCheckoutSession should create stripe session for completed campaign if allowed', async () => {
    prismaMock.campaign.findFirst.mockResolvedValue({
      id: 'complete-campaignp-pass',
      allowDonationOnComplete: true,
      state: CampaignState.complete,
    } as Campaign)

    await expect(controller.createCheckoutSession(mockSession)).resolves.toBeObject()
    expect(prismaMock.campaign.findFirst).toHaveBeenCalled()
    expect(stripeMock.checkout.sessions.create).toHaveBeenCalled()
  })

  it('should request refund for donation', async () => {
    await controller.refundStripePaymet('unique-intent')

    expect(stripeMock.paymentIntents.retrieve).toHaveBeenCalledWith('unique-intent')
    expect(stripeMock.refunds.create).toHaveBeenCalledWith({
      payment_intent: 'unique-intent',
      reason: 'requested_by_customer',
    })
  })
  it(`should not call setupintents.update if no campaignId is provided`, async () => {
    prismaMock.campaign.findFirst.mockResolvedValue({
      id: 'complete-campaign',
      allowDonationOnComplete: false,
      state: CampaignState.complete,
    } as Campaign)

    const payload = {
      metadata: {
        campaignId: 'complete-campaign',
      },
    }

    await expect(controller.updateSetupIntent('123', payload)).rejects.toThrow(
      new NotAcceptableException('Campaign cannot accept donations in state: complete'),
    )
  })
  it(`should  subscription without creating new customer,products`, async () => {
    const user: KeycloakTokenParsed = {
      sub: '00000000-0000-0000-0000-000000000013',
      'allowed-origins': [],
      email: 'test@podkrepi.bg',
    }
    prismaMock.campaign.findFirst.mockResolvedValue({
      id: 'complete-campaign',
      allowDonationOnComplete: false,
      state: CampaignState.complete,
      title: 'active-campaign',
    } as Campaign)
    try {
      await expect(controller.setupIntentToSubscription('123')).toResolve()
      expect(stripeMock.setupIntents.retrieve).toHaveBeenCalledWith('123', {
        expand: ['payment_method'],
      })
      expect(stripeMock.customers.create).not.toHaveBeenCalled()
      expect(stripeMock.products.create).not.toHaveBeenCalled()
    } catch (err) {
      throw new Error(JSON.stringify(err))
    }
  })

  describe('currency conversion endpoints', () => {
    const mockBgnSubscription = {
      id: 'sub_bgn_123',
      metadata: { campaignId: 'campaign-123' },
      items: {
        data: [
          {
            id: 'si_123',
            price: {
              id: 'price_123',
              currency: 'bgn',
              unit_amount: 1956,
              product: 'prod_123',
              recurring: { interval: 'month', interval_count: 1 },
            },
          },
        ],
      },
    }

    describe('convertSubscriptionsCurrency', () => {
      it('should call service to convert all subscriptions', async () => {
        const mockResponse = {
          totalFound: 2,
          successCount: 2,
          failedCount: 0,
          skippedCount: 0,
          exchangeRate: 0.5113,
          sourceCurrency: Currency.BGN,
          targetCurrency: Currency.EUR,
          dryRun: true,
          results: [],
          startedAt: new Date(),
          completedAt: new Date(),
        }

        const convertSpy = jest
          .spyOn(stripeService, 'convertSubscriptionsCurrency')
          .mockResolvedValue(mockResponse)

        const dto: ConvertSubscriptionsCurrencyDto = {
          sourceCurrency: Currency.BGN,
          targetCurrency: Currency.EUR,
          dryRun: true,
        }

        const result = await controller.convertSubscriptionsCurrency(dto)

        expect(convertSpy).toHaveBeenCalledWith(dto)
        expect(result.totalFound).toBe(2)
        expect(result.successCount).toBe(2)
        expect(result.dryRun).toBe(true)
      })

      it('should pass custom exchange rate to service', async () => {
        const mockResponse = {
          totalFound: 1,
          successCount: 1,
          failedCount: 0,
          skippedCount: 0,
          exchangeRate: 0.5,
          sourceCurrency: Currency.BGN,
          targetCurrency: Currency.EUR,
          dryRun: false,
          results: [],
          startedAt: new Date(),
          completedAt: new Date(),
        }

        const convertSpy = jest
          .spyOn(stripeService, 'convertSubscriptionsCurrency')
          .mockResolvedValue(mockResponse)

        const dto: ConvertSubscriptionsCurrencyDto = {
          sourceCurrency: Currency.BGN,
          targetCurrency: Currency.EUR,
          exchangeRate: 0.5,
          batchSize: 50,
        }

        await controller.convertSubscriptionsCurrency(dto)

        expect(convertSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            exchangeRate: 0.5,
            batchSize: 50,
          }),
        )
      })
    })

    describe('convertSingleSubscriptionCurrency', () => {
      it('should call service to convert single subscription', async () => {
        const mockResult = {
          subscriptionId: 'sub_bgn_123',
          originalAmount: 1956,
          convertedAmount: 1000,
          originalCurrency: 'BGN',
          targetCurrency: Currency.EUR,
          success: true,
          campaignId: 'campaign-123',
        }

        const convertSpy = jest
          .spyOn(stripeService, 'convertSingleSubscriptionCurrency')
          .mockResolvedValue(mockResult)

        const dto: ConvertSingleSubscriptionCurrencyDto = {
          targetCurrency: Currency.EUR,
          dryRun: true,
        }

        const result = await controller.convertSingleSubscriptionCurrency('sub_bgn_123', dto)

        expect(convertSpy).toHaveBeenCalledWith('sub_bgn_123', dto)
        expect(result.success).toBe(true)
        expect(result.subscriptionId).toBe('sub_bgn_123')
        expect(result.convertedAmount).toBe(1000)
      })

      it('should pass custom exchange rate to service', async () => {
        const mockResult = {
          subscriptionId: 'sub_bgn_123',
          originalAmount: 1956,
          convertedAmount: 978,
          originalCurrency: 'BGN',
          targetCurrency: Currency.EUR,
          success: true,
        }

        const convertSpy = jest
          .spyOn(stripeService, 'convertSingleSubscriptionCurrency')
          .mockResolvedValue(mockResult)

        const dto: ConvertSingleSubscriptionCurrencyDto = {
          targetCurrency: Currency.EUR,
          exchangeRate: 0.5,
        }

        await controller.convertSingleSubscriptionCurrency('sub_123', dto)

        expect(convertSpy).toHaveBeenCalledWith(
          'sub_123',
          expect.objectContaining({ exchangeRate: 0.5 }),
        )
      })

      it('should return error result when conversion fails', async () => {
        const mockResult = {
          subscriptionId: 'sub_123',
          originalAmount: 0,
          convertedAmount: 0,
          originalCurrency: 'USD',
          targetCurrency: Currency.EUR,
          success: false,
          errorMessage: 'No exchange rate available for USD to EUR',
        }

        jest.spyOn(stripeService, 'convertSingleSubscriptionCurrency').mockResolvedValue(mockResult)

        const dto: ConvertSingleSubscriptionCurrencyDto = {
          targetCurrency: Currency.EUR,
        }

        const result = await controller.convertSingleSubscriptionCurrency('sub_123', dto)

        expect(result.success).toBe(false)
        expect(result.errorMessage).toContain('No exchange rate available')
      })
    })
  })
})
