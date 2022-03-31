import { Test, TestingModule } from '@nestjs/testing'
import { prismaMock } from '../prisma/prisma-client.mock'
import { PrismaService } from '../prisma/prisma.service'
import { CoordinatorController } from './coordinator.controller'
import { CoordinatorService } from './coordinator.service'

const mockData = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    personId: '00000000-0000-0000-0000-000000000010',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    personId: '00000000-0000-0000-0000-000000000010',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    personId: '00000000-0000-0000-0000-000000000010',
  },
]

describe('CoordinatorController', () => {
  let controller: CoordinatorController

  const mockCoordinatorService = {
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
    })
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoordinatorController],
      providers: [
        CoordinatorService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    })
      .overrideProvider(CoordinatorService)
      .useValue(mockCoordinatorService)
    .compile()

    controller = module.get<CoordinatorController>(CoordinatorController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('getData', () => {
    it('should list all coordinators', async () => {
      const result = await controller.findAll()
      expect(result).toHaveLength(3)
      expect(result).toEqual(mockData)
      expect(mockCoordinatorService.findAll).toHaveBeenCalled()
    })
    it('should get one city', async () => {
      const result = await controller.findOne('00000000-0000-0000-0000-000000000001')
      const expected = mockData[0]
      expect(result).toEqual(expected)
      expect(mockCoordinatorService.findOne).toHaveBeenCalledWith('00000000-0000-0000-0000-000000000001')
    })
  })

  describe('create', () => {
    it('should create new coordinator', async () => {
      const personId = '00000000-0000-0000-0000-000000010001'
      const coordinator = await controller.create({personId})
      expect(coordinator.personId).toBe(personId)
      expect(mockCoordinatorService.create).toBeCalledWith({ personId })
    })
  })

  describe('delete', () => {
    it('should update coordinator', async () => {
      await controller.remove('00000000-0000-0000-0000-000000000001')
      expect(mockCoordinatorService.remove).toBeCalled()
    })
  });
})
