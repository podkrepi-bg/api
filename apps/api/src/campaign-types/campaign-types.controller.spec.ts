import { Test, TestingModule } from '@nestjs/testing'
import { CampaignTypeCategory } from '@prisma/client'

import { PrismaService } from '../prisma/prisma.service'
import { CampaignTypesController } from './campaign-types.controller'
import { CampaignTypesService } from './campaign-types.service'

const mockData = [
  {
    id: '0846e9cb-0668-448b-96de-1f35dfa9a1d4',
    name: 'Rehabilitation',
    slug: 'rehabilitation',
    description: null,
    parentId: 'ff7e63c8-ca12-4e34-8880-350a56eb1ba0',
    category: 'medical',
  },
  {
    id: '32f16697-db01-4ae4-8269-b0d7616f9820',
    name: 'Better society',
    slug: 'better-society',
    description: null,
    parentId: null,
    category: 'others',
  },
  {
    id: '343b81b6-0c28-4664-939a-123eef437aa6',
    name: 'Disasters',
    slug: 'disasters',
    description: null,
    parentId: '32f16697-db01-4ae4-8269-b0d7616f9820',
    category: 'disasters',
  },
]

describe('CampaignTypesController', () => {
  let controller: CampaignTypesController

  const mockCampaignTypeService = {
    create: jest.fn((dto) => {
      return {
        id: Date.now(),
        ...dto,
      }
    }),
    findAll: jest.fn().mockReturnValueOnce(mockData),
    update: jest.fn((id, dto) => ({
      id,
      ...dto,
    })),
    findOne: jest.fn((id) => {
      return mockData.find((res) => res.id === id)
    }),
    remove: jest.fn((id) => {
      return mockData.filter((task) => task.id !== id)
    }),
    removeMany: jest.fn(({ ids }) => {
      return mockData.filter((task) => !ids.includes(task.id))
    }),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CampaignTypesController],
      providers: [CampaignTypesService, PrismaService],
    })
      .overrideProvider(CampaignTypesService)
      .useValue(mockCampaignTypeService)
      .compile()

    controller = module.get<CampaignTypesController>(CampaignTypesController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('getData', () => {
    it('should list all campaign types in db', async () => {
      const result = await controller.findAll()
      expect(result).toHaveLength(3)
      expect(result).toEqual(mockData)
      expect(mockCampaignTypeService.findAll).toHaveBeenCalled()
    })
    it('should get one campaign type', async () => {
      const result = await controller.findOne('0846e9cb-0668-448b-96de-1f35dfa9a1d4')
      const expected = mockData[0]
      expect(result).toEqual(expected)
      expect(mockCampaignTypeService.findOne).toHaveBeenCalledWith(
        '0846e9cb-0668-448b-96de-1f35dfa9a1d4',
      )
    })
  })

  describe('create and update data', () => {
    it('it should create campaign type', async () => {
      const result = await controller.create({
        name: 'test',
        category: 'medical',
        slug: 'test',
      })
      const expected = {
        id: expect.any(Number),
        name: 'test',
        category: 'medical',
        slug: 'test',
      }

      expect(result).toEqual(expected)
      expect(mockCampaignTypeService.create).toHaveBeenCalled()
    })

    it('it should update campaign type', async () => {
      const dto = {
        name: 'Testing',
        slug: 'testing',
        category: CampaignTypeCategory.medical,
      }
      expect(await controller.update('0846e9cb-0668-448b-96de-1f35dfa9a1d4', dto)).toEqual({
        id: '0846e9cb-0668-448b-96de-1f35dfa9a1d4',
        ...dto,
      })

      expect(mockCampaignTypeService.update).toHaveBeenCalledWith(
        '0846e9cb-0668-448b-96de-1f35dfa9a1d4',
        dto,
      )
    })
  })

  describe('removeData', () => {
    it('should remove one item', async () => {
      const result = await controller.remove('0846e9cb-0668-448b-96de-1f35dfa9a1d4')

      expect(result).toHaveLength(2)
      expect(mockCampaignTypeService.remove).toBeCalledWith('0846e9cb-0668-448b-96de-1f35dfa9a1d4')
    })

    it('should remove many items', async () => {
      const idsToDelete = [
        '0846e9cb-0668-448b-96de-1f35dfa9a1d4',
        '32f16697-db01-4ae4-8269-b0d7616f9820',
      ]
      const result = await controller.deleteMany({ ids: idsToDelete as [string] })
      const expected = [
        {
          id: '343b81b6-0c28-4664-939a-123eef437aa6',
          name: 'Disasters',
          slug: 'disasters',
          description: null,
          parentId: '32f16697-db01-4ae4-8269-b0d7616f9820',
          category: 'disasters',
        },
      ]

      expect(result).toEqual(expected)
      expect(mockCampaignTypeService.removeMany).toHaveBeenCalledWith({ ids: idsToDelete })
    })
  })
})
