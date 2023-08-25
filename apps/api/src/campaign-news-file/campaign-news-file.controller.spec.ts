import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { CampaignNewsFileController } from './campaign-news-file.controller'
import { CampaignNewsFileService } from './campaign-news-file.service'
import { S3Service } from '../s3/s3.service'
import { PersonService } from '../person/person.service'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { CampaignService } from '../campaign/campaign.service'
import { VaultService } from '../vault/vault.service'
import { KeycloakTokenParsed } from '../auth/keycloak'
import { CampaignNewsService } from '../campaign-news/campaign-news.service'
import { NotificationsProviderInterface } from '../notifications/providers/notifications.interface.providers'
import { SendGridNotificationsProvider } from '../notifications/providers/notifications.sendgrid.provider'
import { MarketingNotificationsModule } from '../notifications/notifications.module'
import { MarketingNotificationsService } from '../notifications/notifications.service'
import { EmailService } from '../email/email.service'
import { TemplateService } from '../email/template.service'

describe('CampaignFileController', () => {
  let controller: CampaignNewsFileController
  let campaignNewsFileService: CampaignNewsFileService
  let personService: PersonService

  const personIdMock = 'testPersonId'
  const fileId = 'fileId'
  const articleId = 'testArticleId'
  const userMock = {
    sub: 'testKeycloackId',
    resource_access: { account: { roles: [] } },
    'allowed-origins': [],
  } as KeycloakTokenParsed

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CampaignNewsFileController, MarketingNotificationsModule],
      providers: [
        {
          provide: CampaignNewsFileService,
          useValue: { create: jest.fn(() => fileId) },
        },
        MockPrismaService,
        EmailService,
        TemplateService,
        S3Service,
        {
          provide: PersonService,
          useValue: { findOneByKeycloakId: jest.fn(() => ({ id: personIdMock })) },
        },
        ConfigService,
        {
          provide: CampaignService,
          useValue: { getCampaignByIdAndCoordinatorId: jest.fn(() => null) },
        },
        VaultService,
        CampaignNewsService,
        {
          // Use the interface as token
          provide: NotificationsProviderInterface,
          // But actually provide the service that implements the interface
          useClass: SendGridNotificationsProvider,
        },
        MarketingNotificationsService,
      ],
    }).compile()

    controller = module.get<CampaignNewsFileController>(CampaignNewsFileController)
    campaignNewsFileService = module.get<CampaignNewsFileService>(CampaignNewsFileService)
    personService = module.get<PersonService>(PersonService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should call service for create campaign file for admin user', async () => {
    const files = [
      { mimetype: 'jpg', originalname: 'testName1', buffer: Buffer.from('') },
      { mimetype: 'jpg', originalname: 'testName2', buffer: Buffer.from('') },
    ] as Express.Multer.File[]

    expect(
      await controller.create(articleId, { roles: ['background'] }, files, {
        ...userMock,
        ...{ resource_access: { account: { roles: ['account-view-supporters'] } } },
      }),
    ).toEqual([fileId, fileId])

    expect(personService.findOneByKeycloakId).toHaveBeenCalledWith(userMock.sub)
    expect(campaignNewsFileService.create).toHaveBeenCalledTimes(2)
  })

  it('should throw an error for missing person', async () => {
    jest.spyOn(personService, 'findOneByKeycloakId').mockResolvedValue(null)

    await expect(controller.create(articleId, { roles: [] }, [], userMock)).rejects.toThrowError()

    expect(personService.findOneByKeycloakId).toHaveBeenCalledWith(userMock.sub)
  })

  it('should throw an error for user not having access', async () => {
    await expect(controller.create(articleId, { roles: [] }, [], userMock)).rejects.toThrowError()

    expect(personService.findOneByKeycloakId).toHaveBeenCalledWith(userMock.sub)
  })
})
