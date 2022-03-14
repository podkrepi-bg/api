import { Test, TestingModule } from '@nestjs/testing'
import { Bootcamp } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { BootcampController } from './bootcamp.controller'
import { BootcampService } from './bootcamp.service'
// import * as mockData from './mockData.json'

const mockData: Bootcamp[] = require('./mockData.json')

describe('BootcampController', () => {
  let controller: BootcampController

  const mockBootcampService = {
    create: jest.fn((dto) => {
      return {
        id: Date.now(),
        ...dto,
      }
    }),
    findAll: jest.fn(() => mockData),
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
      controllers: [BootcampController],
      providers: [BootcampService, PrismaService],
    })
      .overrideProvider(BootcampService)
      .useValue(mockBootcampService)
      .compile()

    controller = module.get<BootcampController>(BootcampController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
  it('should create task', () => {
    const result = controller.create({
      status: 'todo',
      title: 'Opravi si zadachata',
      email: 'borkata90@mail.bg',
      message: 'somting stupid',
      date: '2022-03-25T00:00:00.000Z',
      firstName: 'Bobby',
      lastName: 'Stoychev',
    })
    const expected = {
      id: expect.any(Number),
      status: 'todo',
      title: 'Opravi si zadachata',
      email: 'borkata90@mail.bg',
      message: 'somting stupid',
      date: '2022-03-25T00:00:00.000Z',
      firstName: 'Bobby',
      lastName: 'Stoychev',
    }
    expect(result).toEqual(expected)
  })
  it('should return all tsks', () => {
    const result = controller.findAll()
    expect(result).toBe.length
  })
  it('should udate a task', () => {
    const dto = {
      status: 'todo',
      title: 'Opravi si zadachata',
      email: 'borkata90@mail.bg',
      message: 'somting stupid',
      date: '2022-03-25T00:00:00.000Z',
      firstName: 'Bobby',
      lastName: 'Stoychev',
    }
    expect(controller.update('1', dto)).toEqual({
      id: '1',
      ...dto,
    })
    expect(mockBootcampService.update).toHaveBeenCalled()
  })
  it('should return one task', () => {
    const result = controller.findOne('1ccfac85-1cbd-445d-9619-78cbd6567a44')
    const expected = {
      id: '1ccfac85-1cbd-445d-9619-78cbd6567a44',
      createdAt: '2022-03-14T09:42:39.259Z',
      updatedAt: '2022-03-14T09:42:39.260Z',
      status: 'todo',
      title: 'gdgf',
      email: 'borislav_stoychev@abv.bg',
      message: 'gdfg',
      date: '2022-03-25T00:00:00.000Z',
      firstName: '',
      lastName: '',
    }
    expect(result).toEqual(expected)
  })
  it('should delete one task', () => {
    const result = controller.remove('1ccfac85-1cbd-445d-9619-78cbd6567a44')
    expect(result).toHaveLength(2)
  })
  it('should delete many tasks', () => {
    const toDell = ['1ccfac85-1cbd-445d-9619-78cbd6567a44', '9a373a79-1a8b-48c1-a93a-64174065c625']
    const result = controller.removeMany(toDell as [string])
    const expected = [
      {
        id: 'c609f97e-5cbe-4278-b67b-312aefd94f06',
        createdAt: '2022-03-14T11:03:00.031Z',
        updatedAt: '2022-03-14T11:03:00.032Z',
        status: 'todo',
        title: 'Bootcamp1',
        email: 'eberb@mail1.bg',
        message: 'Neshto smisleno',
        date: '2016-09-18T17:34:02.666Z',
        firstName: 'Borislav',
        lastName: 'Stoychev',
      },
    ]
    expect(result).toEqual(expected)
  })
})
