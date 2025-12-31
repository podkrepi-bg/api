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
import { CacheModule, forwardRef } from '@nestjs/common'
import { DonationsModule } from '../donations/donations.module'
import { RecurringDonation, RecurringDonationStatus } from '@prisma/client'
import { RecurringDonationService } from '../recurring-donation/recurring-donation.service'

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
    prismaMock.recurringDonation.findUnique.mockResolvedValue(mockRecurring)
    prismaMock.recurringDonation.update.mockResolvedValue(mockRecurring)

    await service.cancelSubscription('sub1')
    expect(cancelSubscriptionSpy).toHaveBeenCalledWith('sub1')
  })
})
