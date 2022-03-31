import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { Person } from '@prisma/client'
import { isUUID } from 'class-validator'
import { PersonService } from '../person/person.service'
import { PrismaService } from '../prisma/prisma.service'
import { CoordinatorService } from './coordinator.service'

describe('CoordinatorService', () => {
  let service: CoordinatorService
  let prismaService: PrismaService
  let person: Person
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoordinatorService,
        PrismaService,
        PersonService
      ],
    }).compile()

    service = module.get<CoordinatorService>(CoordinatorService)
    prismaService = module.get<PrismaService>(PrismaService)
    person = await prismaService.person.findFirst({where: {coordinators: {none: {}}}}) as Person
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should return all', async () => {
    const findAll = jest.spyOn(prismaService.coordinator, 'findMany')
    const result = await service.findAll()

    if (result.length) {
      expect(isUUID(result[0].id)).toBe(true)
    }
    expect(findAll).toHaveBeenCalled()
  })

  describe('Find one', () => {
    let id = ''
    it('should return searching coordinator', async () => {
      const findFirst = jest.spyOn(service, 'findOne')
      //create
      const searching = await service.create({personId: person.id})
      id = searching.id
      //findOne
      const result = await service.findOne(id)
      //assert
      expect(findFirst).toHaveBeenCalledWith(id)
      expect(isUUID(id)).toBe(true)
      expect(result?.id).toStrictEqual(searching.id)
      expect(result?.personId).toStrictEqual(searching.personId)

    })
    
    afterAll(async () => {
      if (id) {
        await service.remove(id)
      }
    })
  })
})
