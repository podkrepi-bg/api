import { Test, TestingModule } from '@nestjs/testing'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { CampaignNewsService } from './campaign-news.service'
import { NotificationsProviderInterface } from '../notifications/providers/notifications.interface.providers'
import { SendGridNotificationsProvider } from '../notifications/providers/notifications.sendgrid.provider'
import { ConfigService } from '@nestjs/config'
import { MarketingNotificationsModule } from '../notifications/notifications.module'
import { MarketingNotificationsService } from '../notifications/notifications.service'
import { EmailService } from '../email/email.service'

describe('CampaignNewsService', () => {
  let service: CampaignNewsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [MarketingNotificationsModule],
      providers: [
        CampaignNewsService,
        MockPrismaService,
        CampaignNewsService,
        ConfigService,
        EmailService,
        {
          // Use the interface as token
          provide: NotificationsProviderInterface,
          // But actually provide the service that implements the interface
          useClass: SendGridNotificationsProvider,
        },
        MarketingNotificationsService,
      ],
    }).compile()

    service = module.get<CampaignNewsService>(CampaignNewsService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
