import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { CampaignNewsFileController } from './campaign-news-file.controller'
import { CampaignNewsFileService } from './campaign-news-file.service'
import { S3Service } from '../s3/s3.service'
import { PersonService } from '../person/person.service'
import { MockPrismaService, prismaMock } from '../prisma/prisma-client.mock'
import { CampaignService } from '../campaign/campaign.service'
import { VaultService } from '../vault/vault.service'
import { KeycloakTokenParsed } from '../auth/keycloak'
import { CampaignNewsService } from '../campaign-news/campaign-news.service'
import { NotificationsProviderInterface } from '../notifications/providers/notifications.interface.providers'
import { SendGridNotificationsProvider } from '../notifications/providers/notifications.sendgrid.provider'
import { MarketingNotificationsService } from '../notifications/notifications.service'
import { EmailService } from '../email/email.service'
import { TemplateService } from '../email/template.service'
import { CampaignNewsFile, Prisma } from '@prisma/client'

type PersonWithCompany = Prisma.PersonGetPayload<{
  include: {
    company: true
    beneficiaries: { select: { id: true } }
    organizer: { select: { id: true } }
  }
}>

describe('CampaignNewsFileController', () => {
  let controller: CampaignNewsFileController
  let campaignNewsFileService: CampaignNewsFileService
  let campaignNewsService: CampaignNewsService
  let personService: PersonService

  const fileMock: CampaignNewsFile = {
    id: 'fileId',
    filename: 'filename',
    newsId: '123',
    role: 'background',
    personId: '12',
    mimetype: 'image/jpeg',
  }

  const personMock: PersonWithCompany | null = {
    id: 'e43348aa-be33-4c12-80bf-2adfbf8736cd',
    firstName: 'John',
    lastName: 'Doe',
    keycloakId: 'some-id',
    email: 'user@email.com',
    emailConfirmed: false,
    companyId: null,
    phone: null,
    picture: null,
    createdAt: new Date('2021-10-07T13:38:11.097Z'),
    updatedAt: new Date('2021-10-07T13:38:11.097Z'),
    newsletter: true,
    address: null,
    birthday: null,
    personalNumber: null,
    stripeCustomerId: null,
    profileEnabled: true,
    company: {
      id: '1',
      legalPersonName: 'Admin Dev',
      companyName: 'company-test',
      createdAt: new Date(),
      companyNumber: '123',
      countryCode: '123',
      personId: '12',
      cityId: '1',
      updatedAt: new Date(),
    },
    organizer: {
      id: '1',
    },
    beneficiaries: [],
  }

  const fileId = 'fileId'
  const articleId = 'e43348aa-be33-4c12-80bf-2adfbf8736cd'
  const userMock = {
    sub: 'e43348aa-be33-4c12-80bf-2adfbf8736cd',
    resource_access: { account: { roles: [] } },
    'allowed-origins': [],
  } as KeycloakTokenParsed

  const adminMock = {
    ...userMock,
    resource_access: { account: { roles: ['account-view-supporters'] } },
  }
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CampaignNewsFileController],
      providers: [
        CampaignNewsFileService,
        MockPrismaService,
        EmailService,
        TemplateService,
        {
          provide: S3Service,
          useValue: { uploadObject: jest.fn() },
        },
        {
          provide: PersonService,
          useValue: { findOneByKeycloakId: jest.fn() },
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
    campaignNewsService = module.get<CampaignNewsService>(CampaignNewsService)
    personService = module.get<PersonService>(PersonService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should allow admins to upload files', async () => {
    const files = [
      { mimetype: 'jpg', originalname: 'testName1', buffer: Buffer.from('') },
      { mimetype: 'jpg', originalname: 'testName2', buffer: Buffer.from('') },
    ] as Express.Multer.File[]

    prismaMock.campaignNews.count.mockResolvedValue(0)

    const personSpy = jest.spyOn(personService, 'findOneByKeycloakId').mockResolvedValue(personMock)
    const createSpy = jest.spyOn(campaignNewsFileService, 'create')
    const canEditSpy = jest.spyOn(campaignNewsService, 'canEditArticle')
    prismaMock.campaignNewsFile.create.mockResolvedValue(fileMock)
    expect(
      await controller.create(articleId, { roles: ['background'] }, files, {
        ...adminMock,
      }),
    ).toEqual([fileId, fileId])

    expect(personSpy).toHaveBeenCalledWith(userMock.sub)
    expect(canEditSpy).toHaveBeenCalledWith(articleId, adminMock)
    expect(await campaignNewsService.canEditArticle(articleId, adminMock)).toEqual(true)
    expect(prismaMock.campaignNews.count).toHaveBeenCalledWith({
      where: {
        id: articleId,
        campaign: { organizer: { person: { keycloakId: userMock.sub } } },
      },
    })
    expect(createSpy).toHaveBeenCalledTimes(2)
  })

  it('should allow campaign organizers to upload file ', async () => {
    const files = [
      { mimetype: 'jpg', originalname: 'testName1', buffer: Buffer.from('') },
      { mimetype: 'jpg', originalname: 'testName2', buffer: Buffer.from('') },
    ] as Express.Multer.File[]

    prismaMock.campaignNewsFile.create.mockResolvedValue(fileMock)
    prismaMock.campaignNews.count.mockResolvedValue(1)

    const canEditSpy = jest.spyOn(campaignNewsService, 'canEditArticle')
    const personSpy = jest.spyOn(personService, 'findOneByKeycloakId').mockResolvedValue(personMock)
    const createSpy = jest.spyOn(campaignNewsFileService, 'create')
    expect(
      await controller.create(articleId, { roles: ['background'] }, files, {
        ...userMock,
      }),
    ).toEqual([fileId, fileId])

    expect(personSpy).toHaveBeenCalledWith(userMock.sub)
    expect(canEditSpy).toHaveBeenCalledWith(articleId, userMock)
    expect(await campaignNewsService.canEditArticle(articleId, adminMock)).toEqual(true)
    expect(prismaMock.campaignNews.count).toHaveBeenCalledWith({
      where: {
        id: articleId,
        campaign: { organizer: { person: { keycloakId: userMock.sub } } },
      },
    })
    expect(createSpy).toHaveBeenCalledTimes(2)
  })

  it('should throw an error if neither admin or organizer tries to upload a file', async () => {
    const files = [
      { mimetype: 'jpg', originalname: 'testName1', buffer: Buffer.from('') },
      { mimetype: 'jpg', originalname: 'testName2', buffer: Buffer.from('') },
    ] as Express.Multer.File[]

    prismaMock.campaignNewsFile.create.mockResolvedValue(fileMock)
    prismaMock.campaignNews.count.mockResolvedValue(0)

    const canEditSpy = jest.spyOn(campaignNewsService, 'canEditArticle')
    const personSpy = jest.spyOn(personService, 'findOneByKeycloakId').mockResolvedValue(personMock)
    const createSpy = jest.spyOn(campaignNewsFileService, 'create')
    await expect(
      controller.create(articleId, { roles: ['background'] }, files, {
        ...userMock,
      }),
    ).rejects.toThrowError()

    expect(personSpy).toHaveBeenCalledWith(userMock.sub)
    expect(canEditSpy).toHaveBeenCalledWith(articleId, userMock)
    expect(await campaignNewsService.canEditArticle(articleId, userMock)).toEqual(false)
    expect(prismaMock.campaignNews.count).toHaveBeenCalledWith({
      where: {
        id: articleId,
        campaign: { organizer: { person: { keycloakId: userMock.sub } } },
      },
    })
    expect(createSpy).not.toHaveBeenCalled()
  })

  it('should allow campaign organizer to delete files', async () => {
    prismaMock.campaignNewsFile.count.mockResolvedValue(1)
    const removeSpy = jest.spyOn(campaignNewsFileService, 'remove').mockResolvedValue(fileMock)
    expect(await controller.remove(fileId, userMock)).toEqual(fileMock)
    expect(removeSpy).toHaveBeenCalledWith(fileId)
  })

  it('should allow admin to delete files', async () => {
    prismaMock.campaignNewsFile.count.mockResolvedValue(0)
    const removeSpy = jest.spyOn(campaignNewsFileService, 'remove').mockResolvedValue(fileMock)
    expect(await controller.remove(fileId, adminMock)).toEqual(fileMock)
    expect(removeSpy).toHaveBeenCalledWith(fileId)
  })

  it('should throw an error if delete request is not coming from organizer or admin', async () => {
    prismaMock.campaignNewsFile.count.mockResolvedValue(0)
    jest.spyOn(campaignNewsFileService, 'remove')
    await expect(controller.remove(fileId, userMock)).rejects.toThrowError()
    expect(campaignNewsFileService.remove).not.toHaveBeenCalled()
  })

  it('should throw an error for missing person', async () => {
    jest.spyOn(personService, 'findOneByKeycloakId').mockResolvedValue(null)

    await expect(controller.create(articleId, { roles: [] }, [], userMock)).rejects.toThrowError()
  })

  it('should throw an error for user not having access', async () => {
    await expect(controller.create(articleId, { roles: [] }, [], userMock)).rejects.toThrowError()
  })
})
