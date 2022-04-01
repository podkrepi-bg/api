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
    if(!person) {
      person = await prismaService.person.create({ data: { firstName: "Ivan", lastName: "Petrov", email: "test@test.com" }}) as Person
    }  
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
    it('should return searching coordinator', async () => {
      const findFirst = jest.spyOn(service, 'findOne')
      //create
      const searching = await service.create({personId: person.id})
      const id = searching.id
      //findOne
      const result = await service.findOne(id)
      //assert
      expect(findFirst).toHaveBeenCalledWith(id)
      expect(isUUID(id)).toBe(true)
      expect(result?.id).toStrictEqual(searching.id)
      expect(result?.personId).toStrictEqual(searching.personId)

      if (id) {
        await service.remove(id)
      }
    })
  })

  describe('delete',  () => {
    it('should delete',async () => {
      const coordinator = await service.create({ personId: person.id })
      const remove = jest.spyOn(service, 'remove')
      await service.remove(coordinator.id)

      expect(remove).toBeCalledWith(coordinator.id)
      expect(isUUID(coordinator.id)).toBe(true)
    })
  });
})
