import { Test, TestingModule } from '@nestjs/testing'

import { CampaignType, CampaignTypeCategory, PrismaPromise, Prisma } from '@prisma/client'
import { prismaMock } from '../prisma/prisma-client.mock'
import { PrismaService } from '../prisma/prisma.service'
import { CampaignTypesController } from './campaign-types.controller'
import { CampaignTypesService } from './campaign-types.service'

describe('CampaignTypesController', () => {
  let controller: CampaignTypesController
  let expected: CampaignType[]
  let expectedOne: CampaignType

  beforeEach(() => {
    expected = [
      {
        id: expect.any(String),
        name: expect.any(String),
        parentId: null,
        category: expect.any(String),
        slug: expect.any(String),
        description: null,
      },
      {
        id: 'random-id',
        name: expect.any(String),
        parentId: null,
        category: expect.any(String),
        slug: expect.any(String),
        description: null,
      },
      {
        id: 'random-id-2',
        name: expect.any(String),
        parentId: null,
        category: expect.any(String),
        slug: expect.any(String),
        description: null,
      },
    ]
    expectedOne = {
      id: 'random-id',
      name: expect.any(String),
      parentId: null,
      category: expect.any(String),
      slug: expect.any(String),
      description: null,
    }
  })

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CampaignTypesController],
      providers: [
        CampaignTypesService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile()

    controller = module.get<CampaignTypesController>(CampaignTypesController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('getData', () => {
    it('should list all campaign types in db', async () => {
      const mockList = jest.fn<PrismaPromise<CampaignType[]>, []>().mockResolvedValue(expected)

      const mockImplementation = jest.spyOn(controller, 'findAll').mockImplementation(mockList)

      expect(await controller.findAll()).toEqual(expected)
      expect(await controller.findAll()).toHaveLength(3)
      expect(mockImplementation).toBeCalled()
    })
    it('should get one campaign type', async () => {
      const mockItem = jest.fn<PrismaPromise<CampaignType>, []>().mockResolvedValue(expectedOne)

      const mockImplementation = jest.spyOn(controller, 'findOne').mockImplementation(mockItem)
      expect(await controller.findOne('random-id')).toEqual(expectedOne)
      expect(mockImplementation).toBeCalled()
    })
  })

  describe('create and update data', () => {
    it('it should create campaign type', async () => {
      const itemToPush = {
        id: 'random-id',
        name: 'campaign type',
        parentId: 'random-id',
        slug: 'test',
        category: CampaignTypeCategory.others,
        description: 'no-description',
      }

      const mockItem = jest.fn<PrismaPromise<CampaignType>, []>().mockImplementation(() => {
        expected.push(itemToPush)
        return itemToPush as unknown as PrismaPromise<CampaignType>
      })

      const mockImplementation = jest.spyOn(controller, 'create').mockImplementation(mockItem)

      expect(await controller.create(itemToPush)).toEqual(itemToPush)
      expect(expected).toHaveLength(4)
      expect(mockImplementation).toBeCalled()
    })
    it('it should update campaign type', async () => {
      const itemToUpdate = {
        id: 'random-id',
        name: 'campaign type',
        parentId: 'random-id',
        slug: 'test',
        category: CampaignTypeCategory.others,
        description: 'no-description',
      }
      const index = expected.findIndex((x) => x.id == itemToUpdate.id)

      const mockItem = jest.fn<PrismaPromise<CampaignType>, []>().mockImplementation(() => {
        expected[index] = itemToUpdate
        return itemToUpdate as unknown as PrismaPromise<CampaignType>
      })

      const mockImplementation = jest.spyOn(controller, 'update').mockImplementation(mockItem)

      expect(await controller.update('random-id', itemToUpdate)).toEqual(itemToUpdate)
      expect(expected[index]).toEqual(itemToUpdate)
      expect(mockImplementation).toBeCalled()
    })
  })

  describe('removeData', () => {
    it('should remove one item', async () => {
      const itemToDelete = {
        id: 'random-id',
        name: 'campaign type',
        parentId: 'random-id',
        slug: 'test',
        category: CampaignTypeCategory.others,
        description: 'no-description',
      }

      const mockFn = jest.fn<PrismaPromise<CampaignType>, []>().mockImplementation(() => {
        expected.splice(expected.indexOf(itemToDelete), 1)
        return itemToDelete as unknown as PrismaPromise<CampaignType>
      })

      const mockImplementation = jest.spyOn(controller, 'remove').mockImplementation(mockFn)

      expect(await controller.remove('random-id')).toEqual(itemToDelete)
      expect(expected).toHaveLength(2)
      expect(mockImplementation).toBeCalled()
    })
    it('should remove many items', async () => {
      const idsToDelete = ['random-id', 'random-id-2']
      const deletedItems: CampaignType[] = []
      const mockFn = jest.fn<PrismaPromise<Prisma.BatchPayload>, []>().mockImplementation(() => {
        idsToDelete.map((id) => {
          const itemIndex = expected.findIndex((x) => x.id == id)
          deletedItems.push(expected[itemIndex])
          expected.splice(itemIndex, 1)
        })
        return deletedItems.length as unknown as PrismaPromise<Prisma.BatchPayload>
      })

      const mockImplementation = jest
        .spyOn(prismaMock.campaignType, 'deleteMany')
        .mockImplementation(mockFn)

      expect(
        await prismaMock.campaignType.deleteMany({ where: { id: { in: idsToDelete } } }),
      ).toEqual(2)
      expect(expected).toHaveLength(1)
      expect(mockImplementation).toBeCalled()
    })
  })
})
