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
      providers: [CampaignReportController, CampaignReportService, CampaignService, PersonService, MockPrismaService, S3Service, VaultService],
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
      jest.spyOn(personServiceMock, 'findOneByKeycloakId')
        .mockReturnValueOnce(Promise.resolve(null))

      await expect(
        controller.addReport('1', { photos: [], documents: [] }, new CreateReportDto(), userMock),
      ).rejects.toThrowWithMessage(ForbiddenException, 'The user cannot modify the requested campaign')
    })

    it('should not allow unauthorized users to upload reports', async () => {
      jest.spyOn(campaignService, 'getCampaignByIdWithPersonIds').mockReturnValueOnce(
        Promise.resolve({
          organizer: {
            person: { keycloakId: '' },
          },
          beneficiary: {
            person: { keycloakId: '' },
          },
          coordinator: {
            person: { keycloakId: '' },
          },
        }),
      )

      await expect(
        controller.addReport('1', { photos: [], documents: [] }, new CreateReportDto(), userMock),
      ).rejects.toThrowWithMessage(ForbiddenException, 'The user cannot modify the requested campaign')
    })

    it('should allow authorized users to upload reports', async () => {
      jest.spyOn(campaignService, 'getCampaignByIdWithPersonIds').mockReturnValueOnce(
        Promise.resolve({
          organizer: {
            person: { keycloakId: 'testKeycloakId' },
          },
          beneficiary: {
            person: { keycloakId: '' },
          },
          coordinator: {
            person: { keycloakId: '' },
          },
        }),
      )

      const serviceSpy = jest
        .spyOn(campaignReportService, 'createReport')
        .mockReturnValue(Promise.resolve('description'))

      const result = await controller.addReport(
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
})
