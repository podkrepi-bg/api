import { Test, TestingModule } from '@nestjs/testing'
import { BeneficiaryType, PersonRelation } from '@prisma/client'

import { PrismaService } from '../prisma/prisma.service'
import { BeneficiaryController } from './beneficiary.controller'
import { BeneficiaryService } from './beneficiary.service'

const mockData = [
  {
    id: '150d29a0-0414-4617-8a0b-9f88f6bd22bf',
    type: 'individual',
    personId: '7531b754-985d-4112-81b8-36fc0c23031d',
    coordinatorId: 'da2980b0-86ea-41bd-a7f9-78c49da04e32',
    countryCode: 'BG',
    cityId: 'a7ba19e5-c23b-40d6-bcb0-cf2f4acfb0f5',
    updatedAt: null,
    createdAt: '2022-03-30T09:51:17.431Z',
    coordinatorRelation: 'none',
    description: null,
    privateData: null,
    publicData: null,
    companyId: null,
  },
  {
    id: '159c3d7b-f752-43e9-870b-f05e5b7c313c',
    type: 'individual',
    personId: 'e08d9539-f830-456f-9510-a0f3ef6f93ec',
    coordinatorId: 'da2980b0-86ea-41bd-a7f9-78c49da04e32',
    countryCode: 'BG',
    cityId: 'a7ba19e5-c23b-40d6-bcb0-cf2f4acfb0f5',
    createdAt: '2022-03-30T09:51:17.431Z',
    updatedAt: null,
    coordinatorRelation: 'none',
    description: null,
    privateData: null,
    publicData: null,
    companyId: null,
  },
  {
    id: '160e2ec4-d012-432b-b439-22402a074085',
    type: 'individual',
    personId: '9ed767ca-34b1-408f-ab3f-eb34c8d9dae2',
    coordinatorId: 'da2980b0-86ea-41bd-a7f9-78c49da04e32',
    countryCode: 'BG',
    cityId: 'a7ba19e5-c23b-40d6-bcb0-cf2f4acfb0f5',
    createdAt: '2022-03-30T09:51:17.431Z',
    updatedAt: null,
    coordinatorRelation: 'none',
    description: null,
    privateData: null,
    publicData: null,
    companyId: null,
  },
]

describe('BeneficiaryController', () => {
  let controller: BeneficiaryController

  const mockBeneficiaryService = {
    createBeneficiary: jest.fn((dto) => {
      return {
        id: Date.now(),
        ...dto,
      }
    }),
    listBeneficiaries: jest.fn().mockReturnValueOnce(mockData),
    editBeneficiary: jest.fn((id, dto) => ({
      id,
      ...dto,
    })),
    viewBeneficiary: jest.fn((id) => {
      return mockData.find((res) => res.id === id)
    }),
    removeBeneficiary: jest.fn((id) => {
      return mockData.filter((task) => task.id !== id)
    }),
    removeManyBeneficiaries: jest.fn(({ ids }) => {
      return mockData.filter((task) => !ids.includes(task.id))
    }),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BeneficiaryController],
      providers: [BeneficiaryService, PrismaService],
    })
      .overrideProvider(BeneficiaryService)
      .useValue(mockBeneficiaryService)
      .compile()

    controller = module.get<BeneficiaryController>(BeneficiaryController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('getData', () => {
    it('should list all campaign types in db', async () => {
      const result = await controller.list()
      expect(result).toHaveLength(3)
      expect(result).toEqual(mockData)
      expect(mockBeneficiaryService.listBeneficiaries).toHaveBeenCalled()
    })
    it('should get one campaign type', async () => {
      const result = await controller.getById('150d29a0-0414-4617-8a0b-9f88f6bd22bf')
      const expected = mockData[0]
      expect(result).toEqual(expected)
      expect(mockBeneficiaryService.viewBeneficiary).toHaveBeenCalledWith(
        '150d29a0-0414-4617-8a0b-9f88f6bd22bf',
      )
    })
  })

  describe('create and update data', () => {
    it('it should create campaign type', async () => {
      const result = await controller.create({
        type: 'individual',
        personId: '9ed767ca-34b1-408f-ab3f-eb34c8d9dae2',
        coordinatorId: 'da2980b0-86ea-41bd-a7f9-78c49da04e32',
        countryCode: 'BG',
        cityId: 'a7ba19e5-c23b-40d6-bcb0-cf2f4acfb0f5',
        coordinatorRelation: 'none',
        description: '',
        privateData: '',
        publicData: '',
      })
      const expected = {
        id: expect.any(Number),
        type: 'individual',
        personId: '9ed767ca-34b1-408f-ab3f-eb34c8d9dae2',
        coordinatorId: 'da2980b0-86ea-41bd-a7f9-78c49da04e32',
        countryCode: 'BG',
        cityId: 'a7ba19e5-c23b-40d6-bcb0-cf2f4acfb0f5',
        coordinatorRelation: 'none',
        description: '',
        privateData: '',
        publicData: '',
      }

      expect(result).toEqual(expected)
      expect(mockBeneficiaryService.createBeneficiary).toHaveBeenCalled()
    })

    it('it should update campaign type', async () => {
      const dto = {
        type: BeneficiaryType.individual,
        personId: '9ed767ca-34b1-408f-ab3f-eb34c8d9dae2',
        coordinatorId: 'da2980b0-86ea-41bd-a7f9-78c49da04e32',
        countryCode: 'BG',
        cityId: 'a7ba19e5-c23b-40d6-bcb0-cf2f4acfb0f5',
        coordinatorRelation: PersonRelation.none,
        description: '',
        privateData: '',
        publicData: '',
      }

      expect(await controller.editById('150d29a0-0414-4617-8a0b-9f88f6bd22bf', dto)).toEqual({
        id: '150d29a0-0414-4617-8a0b-9f88f6bd22bf',
        ...dto,
      })

      expect(mockBeneficiaryService.editBeneficiary).toHaveBeenCalledWith(
        '150d29a0-0414-4617-8a0b-9f88f6bd22bf',
        dto,
      )
    })
  })

  describe('removeData', () => {
    it('should remove one item', async () => {
      const result = await controller.deleteById('150d29a0-0414-4617-8a0b-9f88f6bd22bf')

      expect(result).toHaveLength(2)
      expect(mockBeneficiaryService.removeBeneficiary).toBeCalledWith(
        '150d29a0-0414-4617-8a0b-9f88f6bd22bf',
      )
    })

    it('should remove many items', async () => {
      const idsToDelete = [
        '150d29a0-0414-4617-8a0b-9f88f6bd22bf',
        '159c3d7b-f752-43e9-870b-f05e5b7c313c',
      ]
      const result = await controller.deleteMany({ ids: idsToDelete as [string] })
      const expected = [
        {
          id: '160e2ec4-d012-432b-b439-22402a074085',
          type: 'individual',
          personId: '9ed767ca-34b1-408f-ab3f-eb34c8d9dae2',
          coordinatorId: 'da2980b0-86ea-41bd-a7f9-78c49da04e32',
          countryCode: 'BG',
          cityId: 'a7ba19e5-c23b-40d6-bcb0-cf2f4acfb0f5',
          createdAt: '2022-03-30T09:51:17.431Z',
          updatedAt: null,
          coordinatorRelation: 'none',
          description: null,
          privateData: null,
          publicData: null,
          companyId: null,
        },
      ]

      expect(result).toEqual(expected)
      expect(mockBeneficiaryService.removeManyBeneficiaries).toHaveBeenCalledWith({
        ids: idsToDelete,
      })
    })
  })
})
