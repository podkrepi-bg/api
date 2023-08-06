import { Test, TestingModule } from '@nestjs/testing'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { CampaignNewsService } from './campaign-news.service'
import { NotificationsProviderInterface } from '../notifications/providers/notifications.interface.providers'
import { SendGridNotificationsProvider } from '../notifications/providers/notifications.sendgrid.provider'
import { ConfigService } from '@nestjs/config'

describe('CampaignNewsService', () => {
  let service: CampaignNewsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignNewsService,
        MockPrismaService,
        CampaignNewsService,
        ConfigService,
        {
          // Use the interface as token
          provide: NotificationsProviderInterface,
          // But actually provide the service that implements the interface
          useClass: SendGridNotificationsProvider,
        },
      ],
    }).compile()

    service = module.get<CampaignNewsService>(CampaignNewsService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
