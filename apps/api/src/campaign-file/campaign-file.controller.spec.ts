import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { CampaignFileController } from './campaign-file.controller'
import { CampaignFileService } from './campaign-file.service'
import { S3Service } from '../s3/s3.service'
import { PersonService } from '../person/person.service'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { CampaignService } from '../campaign/campaign.service'
import { VaultService } from '../vault/vault.service'
import { KeycloakTokenParsed } from '../auth/keycloak'

describe('CampaignFileController', () => {
  let controller: CampaignFileController
  let campaignFileService: CampaignFileService
  let personService: PersonService
  let campaignService: CampaignService

  const personIdMock = 'testPersonId'
  const fileId = 'fileId'
  const campaignId = 'testCampaignId'
  const userMock = {
    sub: 'testKeycloackId',
    resource_access: { account: { roles: [] } },
    'allowed-origins': [],
  } as KeycloakTokenParsed

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CampaignFileController],
      providers: [
        {
          provide: CampaignFileService,
          useValue: { create: jest.fn(() => fileId) },
        },
        MockPrismaService,
        S3Service,
        {
          provide: PersonService,
          useValue: { findOneByKeycloakId: jest.fn(() => ({ id: personIdMock })) },
        },
        ConfigService,
        {
          provide: CampaignService,
          useValue: { getCampaignByIdAndPersonId: jest.fn(() => null) },
        },
        VaultService,
      ],
    }).compile()

    controller = module.get<CampaignFileController>(CampaignFileController)
    campaignFileService = module.get<CampaignFileService>(CampaignFileService)
    personService = module.get<PersonService>(PersonService)
    campaignService = module.get<CampaignService>(CampaignService)
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
      await controller.create(campaignId, { roles: ['background'] }, files, {
        ...userMock,
        ...{ resource_access: { account: { roles: ['account-view-supporters'] } } },
      }),
    ).toEqual([fileId, fileId])

    expect(personService.findOneByKeycloakId).toHaveBeenCalledWith(userMock.sub)
    expect(campaignService.getCampaignByIdAndPersonId).not.toHaveBeenCalled()
    expect(campaignFileService.create).toHaveBeenCalledTimes(2)
  })

  it('should throw an error for missing person', async () => {
    jest.spyOn(personService, 'findOneByKeycloakId').mockResolvedValue(null)

    await expect(controller.create(campaignId, { roles: [] }, [], userMock)).rejects.toThrowError()

    expect(personService.findOneByKeycloakId).toHaveBeenCalledWith(userMock.sub)
    expect(campaignService.getCampaignByIdAndPersonId).not.toHaveBeenCalled()
  })

  it('should throw an error for user not owning updated campaign', async () => {
    await expect(controller.create(campaignId, { roles: [] }, [], userMock)).rejects.toThrowError()

    expect(personService.findOneByKeycloakId).toHaveBeenCalledWith(userMock.sub)
    expect(campaignService.getCampaignByIdAndPersonId).toHaveBeenCalledWith(
      campaignId,
      personIdMock,
    )
  })
})
