import { Test, TestingModule } from '@nestjs/testing'
import { mockReset } from 'jest-mock-extended'

import { prismaMock, MockPrismaService } from '../prisma/prisma-client.mock'
import { PrismaService } from '../prisma/prisma.service'

import { CountryController } from './country.controller'
import { CountryService } from './country.service'

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
})
