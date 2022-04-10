import { NotFoundException } from '@nestjs/common'
import { Currency } from '.prisma/client'
import { Test, TestingModule } from '@nestjs/testing'
import { CampaignState } from '@prisma/client'
import { MockPrismaService, prismaMock } from '../prisma/prisma-client.mock'
import { PrismaService } from '../prisma/prisma.service'
import { VaultService } from '../vault/vault.service'
import { CampaignController } from './campaign.controller'
import { CampaignService } from './campaign.service'

describe('CampaignController', () => {
  let controller: CampaignController
  let prismaService: PrismaService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CampaignController],
      providers: [CampaignService, MockPrismaService, VaultService],
    }).compile()

    controller = module.get<CampaignController>(CampaignController)
    prismaService = prismaMock
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('viewBySlug ', () => {
    it('should return proper campaign', async () => {
      const slug = 'test-name'
      const mockCampaign = {
        id: 'testId',
        state: CampaignState.active,
        slug,
        title: 'Test name',
        description: null,
        essence: 'test',
        coordinatorId: 'testCoordinatorId',
        beneficiaryId: 'testBeneficiaryId',
        campaignTypeId: 'testCampaignTypeId',
        targetAmount: 1000,
        startDate: null,
        endDate: null,
        createdAt: new Date('2022-04-08T06:36:33.661Z'),
        updatedAt: new Date('2022-04-08T06:36:33.662Z'),
        deletedAt: null,
        approvedById: null,
        currency: Currency.BGN,
        beneficiary: {},
        coordinator: {},
        campaignFiles: [],
        vaults: [{ donations: [{ amount: 100 }, { amount: 10 }] }, { donations: [] }],
      }

      const mockObject = jest.fn().mockResolvedValue(mockCampaign)
      jest.spyOn(prismaService.campaign, 'findFirst').mockImplementation(mockObject)

      expect(await controller.viewBySlug(slug)).toEqual({
        campaign: {
          ...mockCampaign,
          ...{ summary: [{ reachedAmount: 110 }], vaults: [] },
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
})
