import {
  StripeModule as GoLevelUpStripeModule,
  STRIPE_CLIENT_TOKEN,
  StripeModuleConfig,
} from '@golevelup/nestjs-stripe'
import { Test, TestingModule } from '@nestjs/testing'
import { StripeService } from './stripe.service'
import { PersonService } from '../person/person.service'
import { CampaignService } from '../campaign/campaign.service'
import { ConfigModule, ConfigService } from '@nestjs/config'

import { MarketingNotificationsModule } from '../notifications/notifications.module'
import { NotificationModule } from '../sockets/notifications/notification.module'
import { RecurringDonationModule } from '../recurring-donation/recurring-donation.module'
import { EmailService } from '../email/email.service'
import { TemplateService } from '../email/template.service'
import { VaultService } from '../vault/vault.service'
import { ExportService } from '../export/export.service'
import { DonationsService } from '../donations/donations.service'
import { StripeController } from './stripe.controller'
import { MockPrismaService, prismaMock } from '../prisma/prisma-client.mock'
import { PrismaService } from '../prisma/prisma.service'
import { CacheModule, forwardRef } from '@nestjs/common'
import { DonationsModule } from '../donations/donations.module'
import { Currency, RecurringDonation, RecurringDonationStatus } from '@prisma/client'
import { RecurringDonationService } from '../recurring-donation/recurring-donation.service'
import {
  ConvertSingleSubscriptionCurrencyDto,
  ConvertSubscriptionsCurrencyDto,
} from './dto/currency-conversion.dto'

describe('StripeService', () => {
  let service: StripeService

  const mockRecurring = {
    id: '1',
    vaultId: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
    amount: 1,
    currency: 'EUR',
    personId: '1',
    extCustomerId: '1',
    extSubscriptionId: 'sub1',
    campaignId: '1',
    status: RecurringDonationStatus.active,
  } as RecurringDonation

  const mockBgnRecurring = {
    id: '2',
    vaultId: '2',
    createdAt: new Date(),
    updatedAt: new Date(),
    amount: 1956,
    currency: 'BGN',
    personId: '2',
    extCustomerId: '2',
    extSubscriptionId: 'sub_bgn_123',
    campaignId: '2',
    status: RecurringDonationStatus.active,
  } as RecurringDonation

  const stripeMock = {
    checkout: { sessions: { create: jest.fn() } },
    paymentIntents: { retrieve: jest.fn() },
    refunds: { create: jest.fn() },
    subscriptions: {
      cancel: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
      list: jest.fn(),
      create: jest.fn(),
    },
  }
  stripeMock.checkout.sessions.create.mockResolvedValue({ payment_intent: 'unique-intent' })
  stripeMock.paymentIntents.retrieve.mockResolvedValue({
    payment_intent: 'unique-intent',
    metadata: { campaignId: 'unique-campaign' },
  })

  beforeEach(async () => {
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
        RecurringDonationService,
        DonationsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        StripeService,
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

    service = module.get<StripeService>(StripeService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should call stripe cancel service my subscription id', async () => {
    const cancelSubscriptionSpy = jest
      .spyOn(stripeMock.subscriptions, 'cancel')
      .mockImplementation(() => {
        return Promise.resolve({ status: 'canceled' })
      })
    prismaMock.recurringDonation.findUnique.mockResolvedValue(mockRecurring)
    prismaMock.recurringDonation.update.mockResolvedValue(mockRecurring)

    await service.cancelSubscription('sub1')
    expect(cancelSubscriptionSpy).toHaveBeenCalledWith('sub1')
  })

  describe('convertSingleSubscriptionCurrency', () => {
    // Mock subscription with all required fields for currency conversion
    const mockBgnSubscription = {
      id: 'sub_bgn_123',
      customer: 'cus_123',
      metadata: { campaignId: 'campaign-123' },
      items: {
        data: [
          {
            id: 'si_123',
            current_period_end: Math.floor(Date.now() / 1000) + 86400 * 15, // 15 days from now
            price: {
              id: 'price_123',
              currency: 'bgn',
              unit_amount: 1956, // 19.56 BGN
              product: 'prod_123',
              recurring: { interval: 'month', interval_count: 1 },
            },
          },
        ],
      },
    }

    // Mock for the new subscription created after conversion
    const mockNewSubscription = {
      id: 'sub_eur_456',
      customer: 'cus_123',
      metadata: { campaignId: 'campaign-123' },
      items: {
        data: [
          {
            id: 'si_456',
            current_period_end: Math.floor(Date.now() / 1000) + 86400 * 15,
            price: {
              id: 'price_456',
              currency: 'eur',
              unit_amount: 1000,
              product: 'prod_123',
              recurring: { interval: 'month', interval_count: 1 },
            },
          },
        ],
      },
    }

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should convert BGN subscription to EUR in dry-run mode', async () => {
      stripeMock.subscriptions.retrieve.mockResolvedValue(mockBgnSubscription)

      const dto: ConvertSingleSubscriptionCurrencyDto = {
        targetCurrency: Currency.EUR,
        dryRun: true,
      }

      const result = await service.convertSingleSubscriptionCurrency('sub_bgn_123', dto)

      expect(result.success).toBe(true)
      expect(result.subscriptionId).toBe('sub_bgn_123')
      expect(result.originalCurrency).toBe('BGN')
      expect(result.targetCurrency).toBe(Currency.EUR)
      expect(result.originalAmount).toBe(1956)
      // 1956 BGN cents * (1/1.95583) ≈ 1000 EUR cents
      expect(result.convertedAmount).toBeCloseTo(1000, -1) // Within 10 cents
      expect(result.campaignId).toBe('campaign-123')
      // Dry run - should not call update
      expect(stripeMock.subscriptions.update).not.toHaveBeenCalled()
    })

    it('should convert BGN subscription to EUR and update Stripe', async () => {
      stripeMock.subscriptions.retrieve.mockResolvedValue(mockBgnSubscription)
      stripeMock.subscriptions.update.mockResolvedValue({ id: 'sub_bgn_123' })
      stripeMock.subscriptions.cancel.mockResolvedValue({ id: 'sub_bgn_123' })
      stripeMock.subscriptions.create.mockResolvedValue(mockNewSubscription)
      prismaMock.recurringDonation.findFirst.mockResolvedValue(mockBgnRecurring)
      prismaMock.recurringDonation.update.mockResolvedValue(mockBgnRecurring)

      const dto: ConvertSingleSubscriptionCurrencyDto = {
        targetCurrency: Currency.EUR,
        dryRun: false,
      }

      const result = await service.convertSingleSubscriptionCurrency('sub_bgn_123', dto)

      expect(result.success).toBe(true)
      // Should update old subscription metadata with cancelReason, cancel it, create new subscription
      expect(stripeMock.subscriptions.update).toHaveBeenCalledWith(
        'sub_bgn_123',
        expect.objectContaining({
          metadata: expect.objectContaining({
            cancelReason: 'currency_conversion',
          }),
        }),
      )
      expect(stripeMock.subscriptions.cancel).toHaveBeenCalledWith('sub_bgn_123', {
        prorate: false,
      })
      // New subscription is created with inline price_data (not a separate price)
      expect(stripeMock.subscriptions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_123',
          items: expect.arrayContaining([
            expect.objectContaining({
              price_data: expect.objectContaining({
                currency: 'eur', // lowercase as sent to Stripe
                unit_amount: expect.any(Number),
              }),
            }),
          ]),
          metadata: expect.objectContaining({
            originalSubscriptionId: 'sub_bgn_123',
          }),
        }),
      )
      expect(prismaMock.recurringDonation.update).toHaveBeenCalled()
    })

    it('should skip conversion if already in target currency', async () => {
      const eurSubscription = {
        ...mockBgnSubscription,
        items: {
          data: [
            {
              ...mockBgnSubscription.items.data[0],
              price: { ...mockBgnSubscription.items.data[0].price, currency: 'eur' },
            },
          ],
        },
      }
      stripeMock.subscriptions.retrieve.mockResolvedValue(eurSubscription)

      const dto: ConvertSingleSubscriptionCurrencyDto = {
        targetCurrency: Currency.EUR,
      }

      const result = await service.convertSingleSubscriptionCurrency('sub_123', dto)

      expect(result.success).toBe(true)
      expect(result.originalCurrency).toBe('EUR')
      expect(stripeMock.subscriptions.update).not.toHaveBeenCalled()
    })

    it('should use custom exchange rate when provided', async () => {
      stripeMock.subscriptions.retrieve.mockResolvedValue(mockBgnSubscription)

      const dto: ConvertSingleSubscriptionCurrencyDto = {
        targetCurrency: Currency.EUR,
        exchangeRate: 0.5, // Custom rate
        dryRun: true,
      }

      const result = await service.convertSingleSubscriptionCurrency('sub_bgn_123', dto)

      expect(result.success).toBe(true)
      // 1956 * 0.5 = 978
      expect(result.convertedAmount).toBe(978)
    })

    it('should return error for unknown currency pair without custom rate', async () => {
      const usdSubscription = {
        ...mockBgnSubscription,
        items: {
          data: [
            {
              ...mockBgnSubscription.items.data[0],
              price: { ...mockBgnSubscription.items.data[0].price, currency: 'usd' },
            },
          ],
        },
      }
      stripeMock.subscriptions.retrieve.mockResolvedValue(usdSubscription)

      const dto: ConvertSingleSubscriptionCurrencyDto = {
        targetCurrency: Currency.EUR,
      }

      const result = await service.convertSingleSubscriptionCurrency('sub_123', dto)

      expect(result.success).toBe(false)
      expect(result.errorMessage).toContain('No exchange rate available')
    })
  })

  describe('convertSubscriptionsCurrency', () => {
    // Empty response for when there are no subscriptions
    const emptySubscriptions = { data: [], has_more: false }

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should convert all BGN subscriptions to EUR in bulk', async () => {
      const mockActiveSubscriptions = {
        data: [
          {
            id: 'sub_1',
            metadata: { campaignId: 'camp-1' },
            items: {
              data: [
                {
                  id: 'si_1',
                  price: {
                    currency: 'bgn',
                    unit_amount: 1956,
                    product: 'prod_1',
                    recurring: { interval: 'month', interval_count: 1 },
                  },
                },
              ],
            },
          },
          {
            id: 'sub_2',
            metadata: { campaignId: 'camp-2' },
            items: {
              data: [
                {
                  id: 'si_2',
                  price: {
                    currency: 'bgn',
                    unit_amount: 3912,
                    product: 'prod_2',
                    recurring: { interval: 'month', interval_count: 1 },
                  },
                },
              ],
            },
          },
        ],
        has_more: false,
      }
      // Mock returns active subscriptions on first call, empty for trialing
      stripeMock.subscriptions.list
        .mockResolvedValueOnce(mockActiveSubscriptions)
        .mockResolvedValueOnce(emptySubscriptions)

      const dto: ConvertSubscriptionsCurrencyDto = {
        sourceCurrency: Currency.BGN,
        targetCurrency: Currency.EUR,
        dryRun: true,
      }

      const result = await service.convertSubscriptionsCurrency(dto)

      expect(result.totalFound).toBe(2)
      expect(result.successCount).toBe(2)
      expect(result.failedCount).toBe(0)
      expect(result.dryRun).toBe(true)
      expect(result.sourceCurrency).toBe(Currency.BGN)
      expect(result.targetCurrency).toBe(Currency.EUR)
      expect(result.results).toHaveLength(2)
    })

    it('should skip subscriptions not in source currency', async () => {
      const mockSubscriptions = {
        data: [
          {
            id: 'sub_eur',
            metadata: {},
            items: {
              data: [
                {
                  id: 'si_eur',
                  price: {
                    currency: 'eur',
                    unit_amount: 1000,
                    product: 'prod_eur',
                    recurring: { interval: 'month', interval_count: 1 },
                  },
                },
              ],
            },
          },
        ],
        has_more: false,
      }
      // Mock returns EUR subscription for active, empty for trialing
      stripeMock.subscriptions.list
        .mockResolvedValueOnce(mockSubscriptions)
        .mockResolvedValueOnce(emptySubscriptions)

      const dto: ConvertSubscriptionsCurrencyDto = {
        sourceCurrency: Currency.BGN,
        targetCurrency: Currency.EUR,
        dryRun: true,
      }

      const result = await service.convertSubscriptionsCurrency(dto)

      expect(result.totalFound).toBe(1)
      expect(result.skippedCount).toBe(1)
      expect(result.successCount).toBe(0)
    })

    it('should throw error for unknown currency pair without exchange rate', async () => {
      const dto: ConvertSubscriptionsCurrencyDto = {
        sourceCurrency: Currency.USD,
        targetCurrency: Currency.EUR,
      }

      await expect(service.convertSubscriptionsCurrency(dto)).rejects.toThrow(
        'No exchange rate available',
      )
    })

    it('should handle pagination correctly', async () => {
      const page1 = {
        data: [
          {
            id: 'sub_1',
            metadata: {},
            items: {
              data: [
                {
                  id: 'si_1',
                  price: {
                    currency: 'bgn',
                    unit_amount: 1000,
                    product: 'prod_1',
                    recurring: { interval: 'month', interval_count: 1 },
                  },
                },
              ],
            },
          },
        ],
        has_more: true,
      }
      const page2 = {
        data: [
          {
            id: 'sub_2',
            metadata: {},
            items: {
              data: [
                {
                  id: 'si_2',
                  price: {
                    currency: 'bgn',
                    unit_amount: 2000,
                    product: 'prod_2',
                    recurring: { interval: 'month', interval_count: 1 },
                  },
                },
              ],
            },
          },
        ],
        has_more: false,
      }
      // page1 (has_more) -> page2 (no more) for active, then empty for trialing
      stripeMock.subscriptions.list
        .mockResolvedValueOnce(page1)
        .mockResolvedValueOnce(page2)
        .mockResolvedValueOnce(emptySubscriptions)

      const dto: ConvertSubscriptionsCurrencyDto = {
        sourceCurrency: Currency.BGN,
        targetCurrency: Currency.EUR,
        dryRun: true,
        batchSize: 1,
      }

      const result = await service.convertSubscriptionsCurrency(dto)

      expect(result.totalFound).toBe(2)
      // Called 3 times: 2 for active (pagination), 1 for trialing (empty)
      expect(stripeMock.subscriptions.list).toHaveBeenCalledTimes(3)
    })
  })

  describe('listSubscriptions', () => {
    beforeEach(() => {
      stripeMock.subscriptions.list.mockReset()
    })

    it('should list subscriptions without filters', async () => {
      const mockSubscriptions = {
        data: [
          { id: 'sub_1', status: 'active' },
          { id: 'sub_2', status: 'active' },
        ],
        has_more: false,
        object: 'list',
        url: '/v1/subscriptions',
      }
      stripeMock.subscriptions.list.mockResolvedValue(mockSubscriptions)

      const result = await service.listSubscriptions()

      expect(stripeMock.subscriptions.list).toHaveBeenCalledWith(undefined)
      expect(result.data).toHaveLength(2)
      expect(result.data[0].id).toBe('sub_1')
    })

    it('should list subscriptions filtered by price', async () => {
      const mockSubscriptions = {
        data: [{ id: 'sub_price_match', status: 'active' }],
        has_more: false,
        object: 'list',
        url: '/v1/subscriptions',
      }
      stripeMock.subscriptions.list.mockResolvedValue(mockSubscriptions)

      const result = await service.listSubscriptions({
        price: 'price_abc123',
        status: 'active',
      })

      expect(stripeMock.subscriptions.list).toHaveBeenCalledWith({
        price: 'price_abc123',
        status: 'active',
      })
      expect(result.data).toHaveLength(1)
      expect(result.data[0].id).toBe('sub_price_match')
    })

    it('should list subscriptions filtered by customer', async () => {
      const mockSubscriptions = {
        data: [{ id: 'sub_customer', status: 'active' }],
        has_more: false,
        object: 'list',
        url: '/v1/subscriptions',
      }
      stripeMock.subscriptions.list.mockResolvedValue(mockSubscriptions)

      const result = await service.listSubscriptions({
        customer: 'cus_123',
      })

      expect(stripeMock.subscriptions.list).toHaveBeenCalledWith({
        customer: 'cus_123',
      })
      expect(result.data).toHaveLength(1)
    })

    it('should list subscriptions with pagination params', async () => {
      const mockSubscriptions = {
        data: [{ id: 'sub_page2', status: 'active' }],
        has_more: true,
        object: 'list',
        url: '/v1/subscriptions',
      }
      stripeMock.subscriptions.list.mockResolvedValue(mockSubscriptions)

      const result = await service.listSubscriptions({
        limit: 10,
        starting_after: 'sub_previous',
      })

      expect(stripeMock.subscriptions.list).toHaveBeenCalledWith({
        limit: 10,
        starting_after: 'sub_previous',
      })
      expect(result.has_more).toBe(true)
    })

    it('should list subscriptions with expand option', async () => {
      const mockSubscriptions = {
        data: [
          {
            id: 'sub_expanded',
            status: 'active',
            items: { data: [{ price: { id: 'price_123', currency: 'eur' } }] },
          },
        ],
        has_more: false,
        object: 'list',
        url: '/v1/subscriptions',
      }
      stripeMock.subscriptions.list.mockResolvedValue(mockSubscriptions)

      const result = await service.listSubscriptions({
        expand: ['data.items.data.price'],
      })

      expect(stripeMock.subscriptions.list).toHaveBeenCalledWith({
        expand: ['data.items.data.price'],
      })
      expect(result.data[0].items.data[0].price.id).toBe('price_123')
    })

    it('should list subscriptions filtered by status', async () => {
      const mockSubscriptions = {
        data: [{ id: 'sub_canceled', status: 'canceled' }],
        has_more: false,
        object: 'list',
        url: '/v1/subscriptions',
      }
      stripeMock.subscriptions.list.mockResolvedValue(mockSubscriptions)

      const result = await service.listSubscriptions({
        status: 'canceled',
      })

      expect(stripeMock.subscriptions.list).toHaveBeenCalledWith({
        status: 'canceled',
      })
      expect(result.data[0].status).toBe('canceled')
    })
  })
})
