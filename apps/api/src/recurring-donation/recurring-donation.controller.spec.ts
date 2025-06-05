import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { RecurringDonationController } from './recurring-donation.controller'
import { RecurringDonationService } from './recurring-donation.service'
import { HttpService } from '@nestjs/axios'
import { mockDeep } from 'jest-mock-extended'
import { STRIPE_CLIENT_TOKEN } from '@golevelup/nestjs-stripe'

import { StripeService } from '../stripe/stripe.service'
import { PersonService } from '../person/person.service'
import { CampaignService } from '../campaign/campaign.service'
import { DonationsService } from '../donations/donations.service'
import { VaultService } from '../vault/vault.service'
import { ExportService } from '../export/export.service'
import { NotificationService } from '../sockets/notifications/notification.service'
import { NotificationGateway } from '../sockets/notifications/gateway'

describe('RecurringDonationController', () => {
  let controller: RecurringDonationController

  const stripeMock = {
    checkout: { sessions: { create: jest.fn() } },
  }
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecurringDonationController],
      providers: [
        RecurringDonationService,
        MockPrismaService,
        {
          provide: HttpService,
          useValue: mockDeep<HttpService>(),
        },
        StripeService,
        PersonService,
        { provide: CampaignService, useValue: {} },
        DonationsService,
        ConfigService,
        VaultService,
        ExportService,
        NotificationService,
        NotificationGateway,
        {
          provide: STRIPE_CLIENT_TOKEN,
          useValue: stripeMock,
        },
      ],
    }).compile()

    controller = module.get<RecurringDonationController>(RecurringDonationController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
