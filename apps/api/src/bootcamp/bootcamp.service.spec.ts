import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { Bootcamp } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { BootcampService } from './bootcamp.service'

const mockData: Bootcamp[] = require('./mockData.json')

describe('BootcampService', () => {
  let service: BootcampService
  let prisma: PrismaService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BootcampService, PrismaService],
    }).compile()

    service = module.get<BootcampService>(BootcampService)
    prisma = module.get<PrismaService>(PrismaService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
  it('should return all tasks', async () => {
    prisma.bootcamp.findMany = jest.fn().mockReturnValueOnce(mockData)
    expect(await service.findAll()).toHaveLength(3)
  })

  describe('Find one', () => {
    it('should get the first task', async () => {
      //Use `jest.fn()` to mock the specific Prisma function that is used in the function under test (`getFirstJob()`). This will cause the next call to `prisma.name.findMany()` to return the data we've provided. The actual database won't be accessed.
      prisma.bootcamp.findFirst = jest.fn().mockReturnValueOnce(mockData[1])
      const expected = {
        id: '9a373a79-1a8b-48c1-a93a-64174065c625',
        createdAt: '2022-03-14T11:02:27.405Z',
        updatedAt: '2022-03-14T11:02:27.407Z',
        status: 'todo',
        title: 'Bootcamp1',
        email: 'eberb@mail1.bg',
        message: 'Opravi si zadachata',
        date: '2016-09-18T17:34:02.666Z',
        firstName: 'Borislav',
        lastName: 'Stoychev',
      }
      //Check the return value of our function
      expect(await service.findOne('9a373a79-1a8b-48c1-a93a-64174065c625')).toStrictEqual(expected)
    })
    it('should throw error when id not found', async () => {
      expect(async () => {
        await service.findOne('238facc8-b02c-4958-9805-1df7f05b7e8a').catch((e) => e)
      }).rejects.toThrow()
    })
  })
  describe('Remove one', () => {
    it('should delete first task', async () => {
      prisma.bootcamp.delete = jest.fn().mockReturnValueOnce(mockData[2])
      const expected = 'Bootcamp1 Deleted Succesfully!'
      expect(await service.remove('c609f97e-5cbe-4278-b67b-312aefd94f06')).toStrictEqual(expected)
    })
    it('should throw error when id not found', async () => {
      expect(async () => {
        await service.remove('238facc8-b02c-4958-9805-1df7f05b7e8a').catch((e) => e)
      }).rejects.toThrow()
    })
  })
  describe('Remove many', () => {
    it('should throw error when not found ids to remove', () => {
      prisma.bootcamp.deleteMany = jest.fn().mockReturnValueOnce(mockData)
      const idsToDell = [
        '238facc8-b02c-4958-9805-1df7f05b7e8a',
        '31b72876-f74a-4f38-bcda-3a4db0879871',
        '16a5bd8a-e2ec-49af-b7c8-c02244b549de',
        'a616b2ec-77b1-4317-8848-d700ea9f5cfc',
        'd24cc865-7c3d-4862-96a0-8fe9358243e8',
        'bd5e7177-ff03-470c-aecb-ac898dca85e3',
        '368698e6-c3cc-4423-9bce-c3cb50d0b2d2',
      ]

      expect(async () => {
        await service.removeMany(idsToDell as [string]).catch((e) => e)
      }).rejects.toThrow('Requested task ids does not exist!')
    })
    it('should remove selected ids', async () => {
      prisma.bootcamp.deleteMany = jest.fn().mockReturnValueOnce(mockData)
      prisma.bootcamp.findMany = jest.fn().mockReturnValueOnce(mockData)
      const idsToDell = [
        '238facc8-b02c-4958-9805-1df7f05b7e8a',
        '31b72876-f74a-4f38-bcda-3a4db0879871',
        '16a5bd8a-e2ec-49af-b7c8-c02244b549de',
        '1ccfac85-1cbd-445d-9619-78cbd6567a44',
        'd24cc865-7c3d-4862-96a0-8fe9358243e8',
        '9a373a79-1a8b-48c1-a93a-64174065c625',
        'c609f97e-5cbe-4278-b67b-312aefd94f06',
      ]
      expect(await service.removeMany(idsToDell as [string])).toEqual(
        'Deleted Succesfully 3 from 7 tasks!',
      )
    })
  })
  describe('Update', () => {
    it('should udate task', async () => {
      prisma.bootcamp.update = jest.fn().mockReturnValueOnce(mockData[0])
      const data = {
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
      const result = await service.update('1ccfac85-1cbd-445d-9619-78cbd6567a44', data)
      expect(result).toEqual(data)
    })
    it('sholud throw error when id not found', async () => {
      const data = {
        id: '238facc8-b02c-4958-9805-1df7f05b7e8a',
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
      expect(async () => {
        await service.update('238facc8-b02c-4958-9805-1df7f05b7e8a', data).catch((e) => e)
      }).rejects.toThrow()
    })
  })
  describe('Create', () => {
    it('should create task', async () => {
      prisma.bootcamp.create = jest.fn().mockReturnValueOnce(mockData[0])
      const data = {
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
      const result = await service.create(data)
      expect(result).toEqual(data)
    })
    it('should throw error required empty field', () => {
      const data = {
        id: '238facc8-b02c-4958-9805-1df7f05b7e8a',
        createdAt: '2022-03-14T09:42:39.259Z',
        updatedAt: '2022-03-14T09:42:39.260Z',
        status: '',
        title: 'gdgf',
        email: 'borislav_stoychev@abv.bg',
        message: '',
        date: '2022-03-25T00:00:00.000Z',
        firstName: '',
        lastName: '',
      }
      expect(async () => {
        await service.create(data).catch((e) => e)
      }).rejects.toThrow()
    })
    it('should throw error email is not correct', () => {
      const data = {
        id: '238facc8-b02c-4958-9805-1df7f05b7e8a',
        createdAt: '2022-03-14T09:42:39.259Z',
        updatedAt: '2022-03-14T09:42:39.260Z',
        status: 'todo',
        title: 'gdgf',
        email: 'borislav_stoychev',
        message: 'gdfg',
        date: '2022-03-25T00:00:00.000Z',
        firstName: '',
        lastName: '',
      }
      expect(async () => {
        await service.create(data).catch((e) => e)
      }).rejects.toThrow()
    })
  })
})
