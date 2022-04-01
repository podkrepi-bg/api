import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '../prisma/prisma.service'
import { prismaMock } from '../prisma/prisma-client.mock'
import { CityController } from './city.controller'
import { CityService } from './city.service'
import { mockReset } from 'jest-mock-extended'
import { NotFoundException } from '@nestjs/common'
import { CreateCityDto } from './dto/create-city.dto'

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

  beforeEach(async () => {
    prismaMock.city.findMany.mockResolvedValue(mockData)

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CityController],
      providers: [CityService, { provide: PrismaService, useValue: prismaMock}],
    })
      .compile()

    controller = module.get<CityController>(CityController)
  })

  // Reset the mock after each test
  afterEach(() => {
    mockReset(prismaMock)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('getData', () => {
    it('should list all cities', async () => {
      const result = await controller.findAll()
      expect(result).toHaveLength(3)
      expect(result).toEqual(mockData)
    })
    it('should get 1 city', async () => {
      const city = mockData[0]
      prismaMock.city.findFirst.mockResolvedValue(city)

      const result = await controller.findOne(city.id)
      expect(result).toEqual(city)
      expect(prismaMock.city.findFirst).toHaveBeenCalledWith({ where: { id: city.id } })
    })
    it('should throw error if city does not exist', async () => {
      const city = mockData[0]

      await expect(controller.findOne.bind(controller, city.id))
        .rejects.toThrow(new NotFoundException('No city record with ID: ' + city.id))
    })
    it('should create a city', async () => {
      const city = mockData[0]
      prismaMock.city.create.mockResolvedValue(city)

      const createDto: CreateCityDto = {
        name: city.name,
        postalCode: city.postalCode,
        countryId: city.countryId,
      }
      const result = await controller.create(createDto)
      expect(result).toEqual(city)
      expect(prismaMock.city.create).toHaveBeenCalledWith({ data: createDto})
    })
    it('should update a city', async () => {
      const city = mockData[0]
      prismaMock.city.update.mockResolvedValue(city)

      const result = await controller.update(city.id, city)
      expect(result).toEqual(city)
      expect(prismaMock.city.update).toHaveBeenCalledWith(
        {
          where: { id: city.id },
          data: city,
        })
    })
    it('should remove 1 city', async () => {
      const city = mockData[0]
      prismaMock.city.delete.mockResolvedValue(city)
      const result = await controller.remove(city.id)
      expect(result).toEqual(city)
      expect(prismaMock.city.delete).toHaveBeenCalledWith({ where: { id: city.id } })
    })
  })
})
