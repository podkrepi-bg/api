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
import { MockPrismaService } from '../prisma/prisma-client.mock'

describe('StripeService', () => {
  let service: StripeService

  const stripeMock = {
    checkout: { sessions: { create: jest.fn() } },
    paymentIntents: { retrieve: jest.fn() },
    refunds: { create: jest.fn() },
    subscriptions: { cancel: jest.fn() },
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
    }).compile()

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
    await service.cancelSubscription('sub1')
    expect(cancelSubscriptionSpy).toHaveBeenCalledWith('sub1')
  })
})
