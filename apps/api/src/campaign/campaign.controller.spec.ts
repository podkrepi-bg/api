import { NotFoundException } from '@nestjs/common'
import { Currency } from '.prisma/client'
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
      vaults: [{ donations: [{ amount: 100 }, { amount: 10 }] }, { donations: [] }],
    },
  }

  const personIdMock = 'testPersonId'

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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
      const mockList = jest.fn().mockResolvedValue([mockCampaign])
      jest.spyOn(prismaService.campaign, 'findMany').mockImplementation(mockList)

      expect(await controller.getData()).toEqual([
        {
          ...mockCampaign,
          ...{ summary: [{ reachedAmount: 110 }], vaults: [] },
        },
      ])
      expect(prismaService.campaign.findMany).toHaveBeenCalled()
    })
  })

  describe('getAdminList ', () => {
    it('should return proper campaign list', async () => {
      const mockAdminCampaign = {
        ...mockCreateCampaign,
        ...{
          id: 'testId',
          state: CampaignState.draft,
          createdAt: new Date('2022-04-08T06:36:33.661Z'),
          updatedAt: new Date('2022-04-08T06:36:33.662Z'),
          deletedAt: null,
          approvedById: null,
          beneficiary: { firstName: 'Test', lastName: 'Test' },
          coordinator: { firstName: 'Test', lastName: 'Test' },
          organizer: { firstName: 'Test', lastName: 'Test' },
          campaignType: { name: 'Test type' },
          vaults: [
            {
              donations: [
                { amount: 100, personId: 'donorId1' },
                { amount: 10, personId: null },
              ],
            },
            {
              donations: [
                { amount: 100, personId: 'donorId1' },
                { amount: 100, personId: 'donorId2' },
                { amount: 100, personId: null },
              ],
            },
          ],
        },
      }
      const mockList = jest.fn().mockResolvedValue([mockAdminCampaign])
      jest.spyOn(prismaService.campaign, 'findMany').mockImplementation(mockList)

      expect(await controller.getAdminList()).toEqual([
        {
          ...mockAdminCampaign,
          ...{ summary: [{ reachedAmount: 410, donors: 4 }], vaults: [] },
        },
      ])
      expect(prismaService.campaign.findMany).toHaveBeenCalled()
    })
  })

  describe('viewBySlug ', () => {
    it('should return proper campaign', async () => {
      const slug = 'test-name'

      const mockObject = jest.fn().mockResolvedValue({
        ...mockCampaign,
        ...{
          slug,
          vaults: [
            {
              donations: [
                { amount: 100, personId: 'donorId1' },
                { amount: 10, personId: null },
              ],
            },
            {
              donations: [
                { amount: 100, personId: 'donorId1' },
                { amount: 100, personId: 'donorId2' },
                { amount: 100, personId: null },
              ],
            },
          ],
        },
      })
      jest.spyOn(prismaService.campaign, 'findFirst').mockImplementation(mockObject)

      expect(await controller.viewBySlug(slug)).toEqual({
        campaign: {
          ...mockCampaign,
          ...{ summary: [{ reachedAmount: 410, donors: 4 }], vaults: [], slug },
        },
      })
      expect(prismaService.campaign.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { slug } }),
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
