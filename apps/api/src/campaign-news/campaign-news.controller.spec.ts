import { Test, TestingModule } from '@nestjs/testing'
import { PersonService } from '../person/person.service'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { CampaignNewsController } from './campaign-news.controller'
import { CampaignNewsService } from './campaign-news.service'
import { ConfigService } from '@nestjs/config'
import { NotificationsProviderInterface } from '../notifications/providers/notifications.interface.providers'
import { SendGridNotificationsProvider } from '../notifications/providers/notifications.sendgrid.provider'
import { MarketingNotificationsModule } from '../notifications/notifications.module'

describe('CampaignNewsController', () => {
  let controller: CampaignNewsController

  const personIdMock = 'testPersonId'
  const personServiceMock = {
    findOneByKeycloakId: jest.fn(() => {
      return { id: personIdMock }
    }),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [MarketingNotificationsModule],
      controllers: [CampaignNewsController],
      providers: [
        CampaignNewsService,
        PersonService,
        MockPrismaService,
        ConfigService,
        {
          // Use the interface as token
          provide: NotificationsProviderInterface,
          // But actually provide the service that implements the interface
          useClass: SendGridNotificationsProvider,
        },
      ],
    })
      .overrideProvider(PersonService)
      .useValue(personServiceMock)
      .compile()

    controller = module.get<CampaignNewsController>(CampaignNewsController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
