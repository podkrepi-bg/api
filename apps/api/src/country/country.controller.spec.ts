import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { mockReset } from 'jest-mock-extended'

import { prismaMock, MockPrismaService } from '../prisma/prisma-client.mock'

import { CountryController } from './country.controller'
import { CountryService } from './country.service'
import { CreateCountryDto } from './dto/create-country.dto'

const mockData = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Bulgaria',
    countryCode: 'BG',
    cities: ['Sofia', 'Varna', 'Plovdiv'],
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Russia',
    countryCode: 'RU',
    cities: ['Moscow', 'Saint Petersburg'],
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Hungary',
    countryCode: 'HU',
    cities: ['Budapest'],
  },
]

describe('CountryController', () => {
  let controller: CountryController

  beforeEach(async () => {
    prismaMock.country.findMany.mockResolvedValue(mockData)

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CountryController],
      providers: [CountryService, MockPrismaService],
    }).compile()

    controller = module.get<CountryController>(CountryController)
  })

  afterEach(() => {
    mockReset(prismaMock)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should list all countries', async () => {
    const result = await controller.findAll()
    expect(result).toHaveLength(3)
    expect(result).toEqual(mockData)
  })

  it('should get 1 country', async () => {
    const country = mockData[0]
    prismaMock.country.findFirst.mockResolvedValue(country)

    const result = await controller.findOne(country.id)
    expect(result).toEqual(country)
    expect(prismaMock.country.findFirst).toHaveBeenCalledWith({
      where: {
        id: country.id,
      },
      include: {
        cities: true,
      },
      rejectOnNotFound: true,
    })
  })

  it('should throw error if country does not exist', async () => {
    const notExistingId = '12345'

    const prismaSpy = jest.spyOn(prismaMock.country, 'findFirst').mockImplementation(() => {
      const msg = 'No Country record with ID: ' + notExistingId
      throw new NotFoundException(msg)
    })

    await expect(controller.findOne.bind(controller, notExistingId)).rejects.toThrow(
      new NotFoundException(`No Country record with ID: ${notExistingId}`),
    )

    expect(prismaSpy).toHaveBeenCalled()
  })

  it('should create a country', async () => {
    const newCountry = {
      id: '00000000-0000-0000-0000-000000000004',
      name: 'France',
      countryCode: 'FR',
    }

    prismaMock.country.create.mockResolvedValue(newCountry)

    const createDto: CreateCountryDto = {
      name: newCountry.name,
      countryCode: newCountry.countryCode,
    }

    const result = await controller.create(createDto)
    expect(result).toEqual(newCountry)
    expect(prismaMock.country.create).toHaveBeenCalledWith({ data: createDto })
  })
})
