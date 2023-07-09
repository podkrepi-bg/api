import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { Currency, SlugArchive } from '@prisma/client'
import { Test, TestingModule } from '@nestjs/testing'
import { CampaignState } from '@prisma/client'
import { MockPrismaService, prismaMock } from '../prisma/prisma-client.mock'
import { PrismaService } from '../prisma/prisma.service'
import { VaultService } from '../vault/vault.service'
import { CampaignController } from './campaign.controller'
import { CampaignService } from './campaign.service'
import { CreateCampaignDto } from './dto/create-campaign.dto'
import { KeycloakTokenParsed } from '../auth/keycloak'
import { ConfigService } from '@nestjs/config'
import { PersonService } from '../person/person.service'
import * as paymentReferenceGenerator from './helpers/payment-reference'
import { CampaignSummaryDto } from './dto/campaign-summary.dto'
import { NotificationModule } from '../sockets/notifications/notification.module'
import { CampaignNewsModule } from '../campaign-news/campaign-news.module'

describe('CampaignController', () => {
  let controller: CampaignController
  let prismaService: PrismaService
  const personServiceMock = {
    findOneByKeycloakId: jest.fn(() => {
      return { id: personIdMock }
    }),
  }

  const mockCreateCampaign = {
    slug: 'test-slug',
    title: 'Test name',
    description: 'Test description',
    essence: 'test',
    coordinatorId: 'testCoordinatorId',
    beneficiaryId: 'testBeneficiaryId',
    organizerId: 'testOrganizerId',
    companyId: 'testCompanyId',
    campaignTypeId: 'testCampaignTypeId',
    targetAmount: 1000,
    reachedAmount: 0,
    startDate: null,
    endDate: null,
    currency: Currency.BGN,
    toEntity: new CreateCampaignDto().toEntity,
  } as CreateCampaignDto

  const mockCreateCampaignEmptyCoordinator = {
    slug: 'test-slug',
    title: 'Test name',
    description: 'Test description',
    essence: 'test',
    beneficiaryId: 'testBeneficiaryId',
    organizerId: 'testOrganizerId',
    companyId: 'testCompanyId',
    campaignTypeId: 'testCampaignTypeId',
    targetAmount: 1000,
    reachedAmount: 0,
    startDate: null,
    endDate: null,
    currency: Currency.BGN,
    toEntity: new CreateCampaignDto().toEntity,
  } as CreateCampaignDto

  const paymentReferenceMock = 'NY5P-KVO4-DNBZ'
  const mockCampaign = {
    ...mockCreateCampaign,
    ...{
      id: 'testId',
      state: CampaignState.draft,
      createdAt: new Date('2022-04-08T06:36:33.661Z'),
      updatedAt: new Date('2022-04-08T06:36:33.662Z'),
      deletedAt: null,
      approvedById: null,
      beneficiary: {},
      coordinator: {},
      organizer: {},
      campaignFiles: [],
      paymentReference: paymentReferenceMock,
      vaults: [],
    },
  }

  const mockUpdateCampaign = {
    ...mockCreateCampaign,
    ...{
      id: 'testId',
      state: CampaignState.approved,
      createdAt: new Date('2022-04-08T06:36:33.661Z'),
      updatedAt: new Date('2022-04-08T06:36:33.662Z'),
      deletedAt: null,
      approvedById: null,
      beneficiary: { person: { keycloakId: 'testBeneficiaryKeycloakId' } },
      coordinator: { person: { keycloakId: 'testCoordinatorKeycloakId' } },
      organizer: { person: { keycloakId: 'testOrganizerKeycloakId' } },
      company: { person: { keycloakId: 'testCompanyKeycloakId' } },
      campaignFiles: [],
      paymentReference: paymentReferenceMock,
      vaults: [],
    },
  }

  const mockSummary = {
    id: 'testId',
    reachedAmount: 110,
    currentAmount: 0,
    blockedAmount: 0,
    withdrawnAmount: 0,
    donors: 2,
  } as CampaignSummaryDto

  const personIdMock = 'testPersonId'

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [NotificationModule, CampaignNewsModule],
      controllers: [CampaignController],
      providers: [CampaignService, MockPrismaService, VaultService, PersonService, ConfigService],
    })
      .overrideProvider(PersonService)
      .useValue(personServiceMock)
      .compile()

    controller = module.get<CampaignController>(CampaignController)
    prismaService = prismaMock
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('getData ', () => {
    it('should return proper campaign list', async () => {
      const mockList = [mockCampaign]
      prismaMock.campaign.findMany.mockResolvedValue(mockList)
      prismaMock.$queryRaw.mockResolvedValue([mockSummary])

      expect(await controller.getData()).toEqual([
        {
          ...mockCampaign,
          summary: {
            reachedAmount: 110,
            currentAmount: 0,
            blockedAmount: 0,
            withdrawnAmount: 0,
            donors: 2,
          },
        },
      ])
      expect(prismaService.campaign.findMany).toHaveBeenCalled()
    })
  })

  describe('getAdminList ', () => {
    it('should return proper campaign list', async () => {
      const mockAdminCampaign = {
        ...mockCreateCampaign,
        id: 'testId',
        state: CampaignState.draft,
        createdAt: new Date('2022-04-08T06:36:33.661Z'),
        updatedAt: new Date('2022-04-08T06:36:33.662Z'),
        deletedAt: null,
        approvedById: null,
        beneficiary: { firstName: 'Test', lastName: 'Test' },
        coordinator: { firstName: 'Test', lastName: 'Test' },
        organizer: { firstName: 'Test', lastName: 'Test' },
        company: { companyName: 'Test', companyNumber: '123123123' },
        campaignType: { name: 'Test type' },
        paymentReference: paymentReferenceMock,
      }
      const mockList = [mockAdminCampaign]
      prismaMock.campaign.findMany.mockResolvedValue(mockList)
      prismaMock.$queryRaw.mockResolvedValue([mockSummary])

      expect(await controller.getAdminList()).toEqual([
        {
          ...mockAdminCampaign,
          summary: {
            reachedAmount: 110,
            currentAmount: 0,
            blockedAmount: 0,
            withdrawnAmount: 0,
            donors: 2,
          },
        },
      ])
      expect(prismaService.campaign.findMany).toHaveBeenCalled()
    })
  })

  describe('viewBySlug ', () => {
    it('should return proper campaign', async () => {
      const slug = 'test-name'

      const mockObject = {
        ...mockCampaign,
      }
      prismaMock.campaign.findFirst.mockResolvedValue(mockObject)
      prismaMock.$queryRaw.mockResolvedValue([mockSummary])

      expect(await controller.viewBySlug(slug)).toEqual({
        campaign: {
          ...mockCampaign,
          summary: {
            reachedAmount: 110,
            currentAmount: 0,
            blockedAmount: 0,
            withdrawnAmount: 0,
            donors: 2,
          },
        },
      })

      expect(prismaService.campaign.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { slug } }),
      )
      // Since the url was found as current, the archive must not have been checked
      expect(prismaService.slugArchive.findUnique).not.toHaveBeenCalled()
    })

    it('should return campaign if older slug was used', async () => {
      const olderSlug = 'older-slug'

      const mockObject = {
        id: 'someId',
        slug: 'updated-slug',
        campaignId: 'campaign-id',
        campaign: { ...mockCampaign },
      } as SlugArchive

      // Pretend the url was not found(no campaign uses it currently)
      prismaMock.campaign.findFirst.mockResolvedValue(null)
      // Check if it was used before
      prismaMock.slugArchive.findUnique.mockResolvedValue(mockObject)
      prismaMock.$queryRaw.mockResolvedValue([mockSummary])

      expect(await controller.viewBySlug(olderSlug)).toEqual({
        campaign: {
          ...mockCampaign,
          summary: {
            reachedAmount: 110,
            currentAmount: 0,
            blockedAmount: 0,
            withdrawnAmount: 0,
            donors: 2,
          },
        },
      })

      expect(prismaService.campaign.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { slug: olderSlug } }),
      )

      // Since the url was not found as current, the archive must have been checked
      expect(prismaService.slugArchive.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { slug: olderSlug } }),
      )
    })

    it('should throw error for not existing campaign', async () => {
      const slug = 'not-existing'

      const mockObject = jest.fn().mockResolvedValue(null)
      jest.spyOn(prismaService.campaign, 'findFirst').mockImplementation(mockObject)

      await expect(controller.viewBySlug(slug)).rejects.toThrow(
        new NotFoundException('No campaign record with slug: ' + slug),
      )
      expect(prismaService.campaign.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { slug } }),
      )
    })
  })

  describe('update', () => {
    jest
      .spyOn(paymentReferenceGenerator, 'getPaymentReference')
      .mockReturnValue(paymentReferenceMock)

    it('try to update as beneficiery of the campaign', async () => {
      const mockUserUpdate = {
        sub: 'testBeneficiaryKeycloakId',
        resource_access: { account: { roles: [] } },
        'allowed-origins': [],
      } as KeycloakTokenParsed

      prismaMock.campaign.findFirst.mockResolvedValue(mockUpdateCampaign)
      prismaMock.campaign.update.mockResolvedValue(mockUpdateCampaign)

      expect(
        controller.update(mockUpdateCampaign.id, mockCreateCampaign, mockUserUpdate),
      ).resolves.toEqual(mockUpdateCampaign)
    })

    it('try to update as coordinator of the campaign', async () => {
      const mockUserUpdate = {
        sub: 'testCoordinatorKeycloakId',
        resource_access: { account: { roles: [] } },
        'allowed-origins': [],
      } as KeycloakTokenParsed

      prismaMock.campaign.findFirst.mockResolvedValue(mockUpdateCampaign)
      prismaMock.campaign.update.mockResolvedValue(mockUpdateCampaign)
      expect(
        controller.update(mockUpdateCampaign.id, mockCreateCampaign, mockUserUpdate),
      ).resolves.toEqual(mockUpdateCampaign)
    })

    it('try to update as organizer of the campaign', async () => {
      const mockUserUpdate = {
        sub: 'testOrganizerKeycloakId',
        resource_access: { account: { roles: [] } },
        'allowed-origins': [],
      } as KeycloakTokenParsed

      prismaMock.campaign.findFirst.mockResolvedValue(mockUpdateCampaign)
      prismaMock.campaign.update.mockResolvedValue(mockUpdateCampaign)

      expect(
        controller.update(mockUpdateCampaign.id, mockCreateCampaign, mockUserUpdate),
      ).resolves.toEqual(mockUpdateCampaign)
    })

    it('try to update as some other user', async () => {
      const mockUserUpdate = {
        sub: 'testSomeOtherUserId',
        resource_access: { account: { roles: [] } },
        'allowed-origins': [],
      } as KeycloakTokenParsed

      prismaMock.campaign.findFirst.mockResolvedValue(mockUpdateCampaign)

      expect(
        controller.update(mockUpdateCampaign.id, mockCreateCampaign, mockUserUpdate),
      ).rejects.toThrow(
        new ForbiddenException(
          'The user is not coordinator,organizer or beneficiery to the requested campaign',
        ),
      )
    })
  })

  describe('create ', () => {
    const mockUser = {
      sub: 'testKeycloackId',
      resource_access: { account: { roles: [] } },
      'allowed-origins': [],
    } as KeycloakTokenParsed
    jest
      .spyOn(paymentReferenceGenerator, 'getPaymentReference')
      .mockReturnValue(paymentReferenceMock)

    it('should call create with coordinator id', async () => {
      const mockObject = jest.fn().mockResolvedValue(mockCampaign)
      jest.spyOn(prismaService.campaign, 'create').mockImplementation(mockObject)

      expect(await controller.create(mockCreateCampaign, mockUser)).toEqual(mockCampaign)
      expect(personServiceMock.findOneByKeycloakId).not.toHaveBeenCalled()
      expect(prismaService.campaign.create).toHaveBeenCalledWith({
        data: { ...mockCreateCampaign.toEntity(), ...{ paymentReference: paymentReferenceMock } },
      })
    })

    it('calling without coordinator id should make the creator a coordinator', async () => {
      const mockObject = jest.fn().mockResolvedValue(mockCampaign)
      jest.spyOn(prismaService.campaign, 'create').mockImplementation(mockObject)

      expect(await controller.create(mockCreateCampaignEmptyCoordinator, mockUser)).toEqual(
        mockCampaign,
      )
      expect(personServiceMock.findOneByKeycloakId).toHaveBeenCalledWith(mockUser.sub)
      expect(prismaService.campaign.create).toHaveBeenCalledWith({
        data: {
          ...mockCreateCampaign.toEntity(),
          ...{
            coordinator: {
              connectOrCreate: {
                where: { personId: personIdMock },
                create: { personId: personIdMock },
              },
            },
          },
          ...{ paymentReference: paymentReferenceMock },
        },
        include: { coordinator: true },
      })
    })
  })
})
