import { Test, TestingModule } from '@nestjs/testing'
import { PersonService } from '../person/person.service'
import { CampaignReportController } from './campaign-report.controller'
import { CampaignReportService } from './campaign-report.service'
import { CampaignService } from '../campaign/campaign.service'
import { KeycloakTokenParsed } from '../auth/keycloak'
import { CreateReportDto } from './dto/create-report.dto'
import { ForbiddenException } from '@nestjs/common'
import { plainToClass } from 'class-transformer'
import { Multer } from 'multer' // why can't it find it without this import?
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { S3Service } from '../s3/s3.service'
import { VaultService } from '../vault/vault.service'
import { UpdateReportDto } from './dto/update-report.dto'

describe('CampaignReportController', () => {
  let controller: CampaignReportController
  let campaignService: CampaignService
  let campaignReportService: CampaignReportService

  const personServiceMock = {
    findOneByKeycloakId: jest.fn(() => {
      return Promise.resolve({ id: 'personIdMock' } as { id: string } | null)
    }),
  }

  const userMock = {
    sub: 'testKeycloakId',
    resource_access: { account: { roles: [] } },
    'allowed-origins': [],
  } as KeycloakTokenParsed

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignReportController,
        CampaignReportService,
        CampaignService,
        PersonService,
        MockPrismaService,
        S3Service,
        VaultService,
      ],
    })
      .overrideProvider(PersonService)
      .useValue(personServiceMock)
      .compile()

    controller = module.get<CampaignReportController>(CampaignReportController)
    campaignService = module.get<CampaignService>(CampaignService)
    campaignReportService = module.get<CampaignReportService>(CampaignReportService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('create report', () => {
    it('should not allow non-existent users to upload reports', async () => {
      jest
        .spyOn(personServiceMock, 'findOneByKeycloakId')
        .mockReturnValueOnce(Promise.resolve(null))

      await expect(
        controller.create('1', { photos: [], documents: [] }, new CreateReportDto(), userMock),
      ).rejects.toThrowWithMessage(
        ForbiddenException,
        'The user cannot modify the requested campaign',
      )
    })

    it('should not allow unauthorized users to upload reports', async () => {
      jest
        .spyOn(campaignService, 'userCanPerformProtectedCampaignAction')
        .mockResolvedValueOnce(false)

      await expect(
        controller.create('1', { photos: [], documents: [] }, new CreateReportDto(), userMock),
      ).rejects.toThrowWithMessage(
        ForbiddenException,
        'The user cannot modify the requested campaign',
      )
    })

    it('should allow authorized users to upload reports', async () => {
      jest
        .spyOn(campaignService, 'userCanPerformProtectedCampaignAction')
        .mockResolvedValueOnce(true)

      const serviceSpy = jest
        .spyOn(campaignReportService, 'createReport')
        .mockReturnValue(Promise.resolve('description'))

      const result = await controller.create(
        '1',
        { photos: [], documents: [] },
        plainToClass(CreateReportDto, { ...new CreateReportDto(), description: 'descr' }),
        userMock,
      )

      expect(result).toBe('description')
      expect(serviceSpy).toHaveBeenCalledTimes(1)
      expect(serviceSpy).toHaveBeenCalledWith(expect.anything(), '1', 'personIdMock', [], [])
    })
  })

  describe('update report', () => {
    it('should not allow non-existent users to update reports', async () => {
      jest
        .spyOn(personServiceMock, 'findOneByKeycloakId')
        .mockReturnValueOnce(Promise.resolve(null))

      await expect(
        controller.update(
          '1',
          '1,',
          { photos: [], documents: [] },
          new UpdateReportDto(),
          userMock,
        ),
      ).rejects.toThrowWithMessage(
        ForbiddenException,
        'The user cannot modify the requested campaign',
      )
    })

    it('should not allow unauthorized users to update reports', async () => {
      jest
        .spyOn(campaignService, 'userCanPerformProtectedCampaignAction')
        .mockResolvedValueOnce(false)

      await expect(
        controller.update('1', '1', { photos: [], documents: [] }, new UpdateReportDto(), userMock),
      ).rejects.toThrowWithMessage(
        ForbiddenException,
        'The user cannot modify the requested campaign',
      )
    })

    it('should allow authorized users to update reports', async () => {
      jest
        .spyOn(campaignService, 'userCanPerformProtectedCampaignAction')
        .mockResolvedValueOnce(true)

      const serviceSpy = jest
        .spyOn(campaignReportService, 'updateReport')
        .mockResolvedValueOnce(undefined)

      const updateReportDto = new UpdateReportDto()

      await controller.update('1', '1', { photos: [], documents: [] }, updateReportDto, userMock)

      expect(serviceSpy).toHaveBeenCalledTimes(1)
      expect(serviceSpy).toHaveBeenCalledWith('1', '1', 'personIdMock', updateReportDto, [], [])
    })
  })

  describe('delete report', () => {
    it('should not allow non-existent users to delete reports', async () => {
      jest
        .spyOn(personServiceMock, 'findOneByKeycloakId')
        .mockReturnValueOnce(Promise.resolve(null))

      await expect(controller.delete('1', '1,', userMock)).rejects.toThrowWithMessage(
        ForbiddenException,
        'The user cannot modify the requested campaign',
      )
    })

    it('should not allow unauthorized users to delete reports', async () => {
      jest
        .spyOn(campaignService, 'userCanPerformProtectedCampaignAction')
        .mockResolvedValueOnce(false)

      await expect(controller.delete('1', '1', userMock)).rejects.toThrowWithMessage(
        ForbiddenException,
        'The user cannot modify the requested campaign',
      )
    })

    it('should allow authorized users to delete reports', async () => {
      jest
        .spyOn(campaignService, 'userCanPerformProtectedCampaignAction')
        .mockResolvedValueOnce(true)

      const serviceSpy = jest
        .spyOn(campaignReportService, 'softDeleteReport')
        .mockResolvedValueOnce({} as any)

      await controller.delete('1', '1', userMock)

      expect(serviceSpy).toHaveBeenCalledTimes(1)
      expect(serviceSpy).toHaveBeenCalledWith('1', '1')
    })
  })
})
