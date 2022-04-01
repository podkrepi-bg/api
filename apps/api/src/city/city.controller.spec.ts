import { City, PrismaPromise } from '.prisma/client'
import { Test, TestingModule } from '@nestjs/testing'

import { PrismaService } from '../prisma/prisma.service'
import { prismaMock } from '../prisma/prisma-client.mock'
import { CityController } from './city.controller'
import { CityService } from './city.service'

const mockData = [
  {
    countryId: '00000000-0000-0000-0000-000000000010',
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Sofia',
    postalCode: '1000',
  },
  {
    countryId: '00000000-0000-0000-0000-000000000010',
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Plovdiv',
    postalCode: '4000',
  },
  {
    countryId: '00000000-0000-0000-0000-000000000010',
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Varna',
    postalCode: '9000',
  },
]

describe('CityController', () => {
  let controller: CityController

  const mockCityService = {
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
    removeMany: jest.fn((ids) => {
      return mockData.filter((task) => !ids.includes(task.id))
    }),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CityController],
      providers: [CityService, PrismaService],
    })
      .overrideProvider(CityService)
      .useValue(mockCityService)
      .compile()

    controller = module.get<CityController>(CityController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('getData', () => {
    it('should list all cities in db', async () => {
      const result = await controller.findAll()
      expect(result).toHaveLength(3)
      expect(result).toEqual(mockData)
      expect(mockCityService.findAll).toHaveBeenCalled()
    })
    it('should get one city', async () => {
      const result = await controller.findOne('00000000-0000-0000-0000-000000000001')
      const expected = mockData[0]
      expect(result).toEqual(expected)
      expect(mockCityService.findOne).toHaveBeenCalledWith('00000000-0000-0000-0000-000000000001')
    })
  })

  describe('create and update data', () => {
    it('it should create city', async () => {
      const result = await controller.create({
        countryId: '00000000-0000-0000-0000-000000000010',
        name: 'Sofia',
        postalCode: '1000',
      })
      const expected = {
        id: expect.any(Number),
        countryId: '00000000-0000-0000-0000-000000000010',
        name: 'Sofia',
        postalCode: '1000',
      }

      expect(result).toEqual(expected)
      expect(mockCityService.create).toHaveBeenCalled()
    })

    it('it should update city', async () => {
      const dto = {
        countryId: '00000000-0000-0000-0000-000000000010',
        name: 'Sofia',
        postalCode: '1000',
      }

      expect(await controller.update('1', dto)).toEqual({
        id: '1',
        ...dto,
      })

      expect(mockCityService.update).toHaveBeenCalledWith('1', dto)
    })
  })

  describe('removeData', () => {
    it('should remove one item', async () => {
      const result = await controller.remove('00000000-0000-0000-0000-000000000001')

      expect(result).toHaveLength(2)
      expect(mockCityService.remove).toBeCalledWith('00000000-0000-0000-0000-000000000001')
    })
  })
})
