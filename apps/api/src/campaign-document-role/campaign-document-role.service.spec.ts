import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { isUUID } from 'class-validator'
import { PrismaService } from '../prisma/prisma.service'
import { CampaignDocumentRoleService } from './campaign-document-role.service'

describe('CampaignDocumentRoleService', () => {
  let service: CampaignDocumentRoleService
  let prismaService: PrismaService
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CampaignDocumentRoleService, PrismaService],
    }).compile()

    service = module.get<CampaignDocumentRoleService>(CampaignDocumentRoleService)
    prismaService = module.get<PrismaService>(PrismaService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
  it('should return all documents', async () => {
    const findAll = jest.spyOn(prismaService.campaignDocumentRole, 'findMany')
    const result = await service.findAll()
    if (result.length) {
      expect(isUUID(result[0].id)).toBe(true)
    }
    expect(result).toBeArray()
    expect(findAll).toHaveBeenCalled()
  })
  describe('Find one', () => {
    let id = ''
    const data = {
      name: 'todo',
      description: 'Bootcamp1',
    }
    it('should return searching document', async () => {
      const findFirst = jest.spyOn(service, 'findOne')
      //create
      const searching = await service.create(data)
      id = searching.id
      //findOne
      const result = await service.findOne(id)
      //assert
      expect(findFirst).toHaveBeenCalledWith(id)
      expect(isUUID(id)).toBe(true)
      expect(result).toStrictEqual(searching)
    })
    it('should throw error when id not found', async () => {
      await expect(service.findOne(id + 'p')).rejects.toThrow(NotFoundException)
    })
    afterAll(async () => {
      //clean db
      if (id) {
        await service.remove(id)
      }
    })
  })
  describe('Remove one', () => {
    let id = ''
    const data = {
      name: 'todo',
      description: 'Bootcamp1',
    }
    it('should delete first document', async () => {
      const remove = jest.spyOn(service, 'remove')
      //create
      const searching = await service.create(data)
      id = searching.id
      //remove
      const result = await service.remove(id)
      //assert
      expect(remove).toHaveBeenCalledWith(id)
      expect(isUUID(id)).toBe(true)
      expect(result).toStrictEqual(`${data.name} Deleted Succesfully!`)
    })
    it('should throw error when id not found', async () => {
      await expect(service.remove(id + 'p')).rejects.toThrow(NotFoundException)
    })
  })
  describe('Remove many', () => {
    let id = ''
    const data = {
      name: 'todo',
      description: 'Bootcamp1',
    }
    const idsToDell = [
      '238facc8-b02c-4958-9805-1df7f05b7e8a',
      '31b72876-f74a-4f38-bcda-3a4db0879871',
      '16a5bd8a-e2ec-49af-b7c8-c02244b549de',
      'a616b2ec-77b1-4317-8848-d700ea9f5cfc',
      'd24cc865-7c3d-4862-96a0-8fe9358243e8',
      'bd5e7177-ff03-470c-aecb-ac898dca85e3',
      '368698e6-c3cc-4423-9bce-c3cb50d0b2d2',
    ]
    it('should throw error when not found ids to remove', async () => {
      await expect(service.removeMany(idsToDell as [string])).rejects.toThrowWithMessage(
        NotFoundException,
        'Requested document`s ids does not exist!',
      )
    })
    it('should remove selected ids', async () => {
      const removeSelected = jest.spyOn(service, 'removeMany')
      //create document
      const searching = await service.create(data)
      //push id to list ids
      idsToDell.push(searching.id)
      //delete many
      const removeMany = await service.removeMany(idsToDell as [string])
      //assert
      expect(removeSelected).toHaveBeenCalledWith(idsToDell)
      expect(idsToDell.map((id) => isUUID(id))).toEqual([
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
      ])
      expect(removeMany).toStrictEqual(`Deleted Succesfully 1 from 8 tasks!`)
    })
    afterAll(async () => {
      //clean db
      if (id) {
        await service.remove(id)
      }
    })
  })
  describe('Update', () => {
    let id = ''
    const data = {
      name: 'todo',
      description: 'gdgf',
    }
    it('should udate document', async () => {
      const update = jest.spyOn(service, 'update')
      //create
      const searching = await service.create(data)
      id = searching.id
      //update
      const newData = {
        id,
        name: 'Todo',
        description: 'somthing',
      }
      const result = await service.update(id, newData)
      //assert
      expect(update).toHaveBeenCalledWith(id, newData)
      expect(isUUID(id)).toEqual(true)
      expect(result.name).toStrictEqual(newData.name)
      expect(result.description).toStrictEqual(newData.description)
    })
    it('sholud throw error when id not found', async () => {
      await expect(service.update(id + '6', data)).rejects.toThrow(NotFoundException)
    })
    afterAll(async () => {
      //clean db
      if (id) {
        await service.remove(id)
      }
    })
  })
  describe('Create', () => {
    let id = ''
    const data = {
      name: 'Bobby',
      description: 'gdgf',
    }
    it('should create document', async () => {
      const create = jest.spyOn(service, 'create')
      const result = await service.create(data)
      id = result.id
      expect(create).toHaveBeenCalledWith(data)
      expect(isUUID(result.id)).toBe(true)
      expect(result.name).toStrictEqual(data.name)
      expect(result.description).toStrictEqual(data.description)
    })
    afterAll(async () => {
      //clean db
      if (id) {
        await service.remove(id)
      }
    })
  })
})
