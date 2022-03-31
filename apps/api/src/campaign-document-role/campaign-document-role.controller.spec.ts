import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { isUUID } from 'class-validator'
import { PrismaService } from '../prisma/prisma.service'
import { CampaignDocumentRoleController } from './campaign-document-role.controller'
import { CampaignDocumentRoleService } from './campaign-document-role.service'

describe('CampaignDocumentRoleController', () => {
  let controller: CampaignDocumentRoleController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CampaignDocumentRoleController],
      providers: [CampaignDocumentRoleService, PrismaService],
    }).compile()

    controller = module.get<CampaignDocumentRoleController>(CampaignDocumentRoleController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
  it('should return all documents', async () => {
    const findAll = jest.spyOn(controller, 'findAll')
    const result = await controller.findAll()
    if (result.length) {
      expect(isUUID(result[0].id)).toBe(true)
    }
    expect(findAll).toHaveBeenCalled()
    expect(findAll).toHaveReturnedTimes(1)
  })
  describe('Find one', () => {
    let id = ''
    const data = {
      name: 'todo',
      description: 'Bootcamp1',
    }
    it('should return searching document', async () => {
      const find = jest.spyOn(controller, 'findOne')
      //create
      const searching = await controller.create(data)
      id = searching.id
      //findOne
      const result = await controller.findOne(id)
      //assert
      expect(find).toHaveBeenCalledWith(id)
      expect(find).toHaveReturnedTimes(1)
      expect(isUUID(id)).toBe(true)
      expect(result).toStrictEqual(searching)
    })
    it('should throw error when id not found', async () => {
      await expect(controller.findOne(id + 'p')).rejects.toThrow(NotFoundException)
    })
    afterAll(async () => {
      //clean db
      if (id) {
        await controller.remove(id)
      }
    })
  })
  describe('Remove', () => {
    let id = ''
    const data = {
      name: 'todo',
      description: 'Bootcamp1',
    }
    it('should delete а document', async () => {
      const remove = jest.spyOn(controller, 'remove')
      //create
      const searching = await controller.create(data)
      id = searching.id
      //remove
      const result = await controller.remove(id)
      //assert
      expect(remove).toHaveBeenCalledWith(id)
      expect(remove).toHaveReturnedTimes(1)
      expect(isUUID(id)).toBe(true)
      expect(result).toStrictEqual(`${data.name} Deleted Succesfully!`)
      await expect(controller.findOne(id)).rejects.toThrow(NotFoundException)
    })
    it('should throw error when id not found', async () => {
      await expect(controller.remove(id)).rejects.toThrow(NotFoundException)
    })
  })
  describe('Remove many', () => {
    const id = ''
    const data = {
      name: 'todo',
      description: 'Bootcamp1',
    }
    const idsToDell = [
      'd24cc865-7c3d-4862-96a0-8fe9358243e8',
      'bd5e7177-ff03-470c-aecb-ac898dca85e3',
      '368698e6-c3cc-4423-9bce-c3cb50d0b2d2',
    ]
    it('should throw error when not found ids to remove', async () => {
      await expect(controller.removeMany(idsToDell as [string])).rejects.toThrow(NotFoundException)
    })
    it('should remove selected ids', async () => {
      const removeSelected = jest.spyOn(controller, 'removeMany')
      //create document
      const searching = await controller.create(data)
      //push id to list ids
      idsToDell.push(searching.id)
      //delete many
      const removeMany = await controller.removeMany(idsToDell as [string])
      //assert
      expect(removeSelected).toHaveBeenCalledWith(idsToDell)
      expect(removeSelected).toHaveReturnedTimes(1)
      expect(idsToDell.map((id) => isUUID(id))).toEqual([true, true, true, true])
      expect(removeMany).toStrictEqual(`Deleted Succesfully 1 from 4 tasks!`)
    })
    afterAll(async () => {
      //clean db
      if (id) {
        await controller.remove(id)
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
      const update = jest.spyOn(controller, 'update')
      //create
      const searching = await controller.create(data)
      id = searching.id
      //update
      const newData = {
        id,
        name: 'Todo',
        description: 'somthing',
      }
      const result = await controller.update(id, newData)
      //assert
      expect(update).toHaveBeenCalledWith(id, newData)
      expect(update).toHaveReturnedTimes(1)
      expect(isUUID(id)).toEqual(true)
      expect(result.name).toStrictEqual(newData.name)
      expect(result.description).toStrictEqual(newData.description)
    })
    it('sholud throw error when id not found', async () => {
      await expect(controller.update(id + '6', data)).rejects.toThrow(NotFoundException)
    })
    afterAll(async () => {
      //clean db
      if (id) {
        await controller.remove(id)
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
      const create = jest.spyOn(controller, 'create')
      const result = await controller.create(data)
      id = result.id
      expect(create).toHaveBeenCalledWith(data)
      expect(create).toHaveReturnedTimes(1)
      expect(isUUID(id)).toBe(true)
      expect(result.name).toStrictEqual(data.name)
      expect(result.description).toStrictEqual(data.description)
    })
    afterAll(async () => {
      //clean db
      if (id) {
        await controller.remove(id)
      }
    })
  })
})
