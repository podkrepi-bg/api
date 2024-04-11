import {
  StripeModule as GoLevelUpStripeModule,
  STRIPE_CLIENT_TOKEN,
  StripeModuleConfig,
} from '@golevelup/nestjs-stripe'
import { Test, TestingModule } from '@nestjs/testing'
import { StripeController } from './stripe.controller'
import { StripeService } from './stripe.service'
import { MockPrismaService, prismaMock } from '../prisma/prisma-client.mock'
import { Campaign, CampaignState } from '@prisma/client'
import { CreateSessionDto } from '../donations/dto/create-session.dto'
import { NotAcceptableException } from '@nestjs/common'
import { PersonService } from '../person/person.service'
import { CampaignService } from '../campaign/campaign.service'
import { MarketingNotificationsService } from '../notifications/notifications.service'
import { ConfigService } from 'aws-sdk'
import { ConfigModule } from '@nestjs/config'
import { PersonModule } from '../person/person.module'
import { CampaignModule } from '../campaign/campaign.module'
import { MarketingNotificationsModule } from '../notifications/notifications.module'
import { DonationsModule } from '../donations/donations.module'
import { RecurringDonationModule } from '../recurring-donation/recurring-donation.module'
import configuration from '../config/configuration'
import { StripePaymentService } from './events/stripe-payment.service'
import { EmailService } from '../email/email.service'
import { NotificationsProviderInterface } from '../notifications/providers/notifications.interface.providers'
import { TemplateService } from '../email/template.service'
import { DonationsService } from '../donations/donations.service'
import { VaultService } from '../vault/vault.service'
import { ExportService } from '../export/export.service'
import { NotificationModule } from '../sockets/notifications/notification.module'
import { CACHE_MANAGER } from '@nestjs/cache-manager'

describe('StripeController', () => {
  let controller: StripeController

  const stripeMock = {
    checkout: { sessions: { create: jest.fn() } },
    paymentIntents: { retrieve: jest.fn() },
    refunds: { create: jest.fn() },
  }
  stripeMock.checkout.sessions.create.mockResolvedValue({ payment_intent: 'unique-intent' })
  stripeMock.paymentIntents.retrieve.mockResolvedValue({
    payment_intent: 'unique-intent',
    metadata: { campaignId: 'unique-campaign' },
  })

  const mockSession = {
    mode: 'payment',
    amount: 100,
    campaignId: 'testCampaignId',
    successUrl: 'http://test.com',
    cancelUrl: 'http://test.com',
    isAnonymous: true,
  } as CreateSessionDto

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
        GoLevelUpStripeModule.forRootAsync(GoLevelUpStripeModule, {
          useFactory: () => moduleConfig,
        }),
        MarketingNotificationsModule,
        NotificationModule,
        RecurringDonationModule,
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
        MockPrismaService,
        {
          provide: STRIPE_CLIENT_TOKEN,
          useValue: stripeMock,
        },
      ],
    }).compile()

    controller = module.get<StripeController>(StripeController)
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
})
