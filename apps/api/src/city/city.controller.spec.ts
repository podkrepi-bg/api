import { City, PrismaPromise } from '.prisma/client'
import { Test, TestingModule } from '@nestjs/testing'

import { PrismaService } from '../prisma/prisma.service'
import { prismaMock } from '../prisma/prisma-client.mock'
import { CityController } from './city.controller'
import { CityService } from './city.service'

describe('CityController', () => {
  let controller: CityController
  let prismaService: PrismaService

  beforeEach(() => {
    prismaService = prismaMock
  })

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CityController],
      providers: [
        CityService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile()

    controller = module.get<CityController>(CityController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('getData', () => {
    it('should list all cities in db', async () => {
      const expected: City[] = [
        {
          countryId: expect.any(String),
          id: expect.any(String),
          name: 'Sofia',
          postalCode: '1000',
        },
        {
          countryId: expect.any(String),
          id: expect.any(String),
          name: 'Plovdiv',
          postalCode: '4000',
        },
        {
          countryId: expect.any(String),
          id: expect.any(String),
          name: 'Varna',
          postalCode: '9000',
        },
      ]

      const mockList = jest.fn<PrismaPromise<City[]>, []>().mockResolvedValue(expected)

      jest.spyOn(prismaService.city, 'findMany').mockImplementation(mockList)

      expect(await controller.getData()).toIncludeSameMembers(expected)
    })
  })
})
