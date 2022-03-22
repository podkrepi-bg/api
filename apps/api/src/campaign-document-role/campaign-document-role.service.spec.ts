import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { CampaignDocumentRole, PrismaPromise } from '@prisma/client'
import { isUUID } from 'class-validator'
import { prismaMock } from '../prisma/prisma-client.mock'
import { PrismaService } from '../prisma/prisma.service'
import { CampaignDocumentRoleService } from './campaign-document-role.service'

const mockData = [
  {
    id: '5f9221cf-f067-4011-8d2a-66b59509fb7b',
    createdAt: new Date('2000-10-31T01:30:00.000-05:00'),
    updatedAt: new Date('2000-10-31T01:30:00.000-05:00'),
    name: 'Bobby',
    description: '',
  },
  {
    id: 'dc7c8d51-732a-4b82-a87e-f62a9c2e9a68',
    createdAt: new Date('2000-10-31T01:30:00.000-05:00'),
    updatedAt: new Date('2000-10-31T01:30:00.000-05:00'),
    name: 'image',
    description: '',
  },
  {
    id: 'dc7c8d51-732a-4b82-a87e-f62a9c2e9a99',
    createdAt: new Date('2000-10-31T01:30:00.000-05:00'),
    updatedAt: new Date('2000-10-31T01:30:00.000-05:00'),
    name: 'image',
    description: '',
  },
]

describe('CampaignDocumentRoleService', () => {
  let service: CampaignDocumentRoleService
  const prismaService = prismaMock
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignDocumentRoleService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile()

    service = module.get<CampaignDocumentRoleService>(CampaignDocumentRoleService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
  it('should return all documents', async () => {
    const mockList = jest
      .fn<PrismaPromise<CampaignDocumentRole[]>, []>()
      .mockResolvedValue(mockData)

    jest.spyOn(prismaService.campaignDocumentRole, 'findMany').mockImplementation(mockList)

    expect(await service.findAll()).toIncludeSameMembers(mockData)
    expect(await service.findAll()).toHaveLength(3)
    expect(mockList).toHaveBeenCalled()
    await expect(service.findAll()).resolves.toEqual(mockData)
  })
  describe('Find one', () => {
    const id = '5f9221cf-f067-4011-8d2a-66b59509fb7b'
    it('should return searching document', async () => {
      const findFirst = jest.spyOn(service, 'findOne')
      await service.findOne(id)
      expect(findFirst).toHaveBeenCalledWith(id)
      expect(isUUID(id)).toBe(true)
    })
    it('should throw error when id not found', async () => {
      prismaService.campaignDocumentRole.findFirst.mockRejectedValue(
        new Error('Document not found!'),
      )
      await expect(service.findOne(id)).rejects.toThrowWithMessage(
        NotFoundException,
        'Document not found!',
      )
    })
  })
  describe('Remove one', () => {
    const id = '5f9221cf-f067-4011-8d2a-66b59509fb7b'
    it('should delete first document', async () => {
      const removeFirs = jest.spyOn(service, 'remove')
      prismaService.campaignDocumentRole.delete.mockResolvedValue(mockData[0])
      await service.remove(id)
      expect(removeFirs).toHaveBeenCalledWith(id)
      expect(isUUID(id)).toBe(true)
    })
    it('should throw error when id not found', async () => {
      prismaService.campaignDocumentRole.delete.mockRejectedValue(new Error('Document not found!'))
      await expect(service.remove(id)).rejects.toThrowWithMessage(
        NotFoundException,
        'Document not found!',
      )
    })
  })
  describe('Remove many', () => {
    const idsToDell = [
      '238facc8-b02c-4958-9805-1df7f05b7e8a',
      '31b72876-f74a-4f38-bcda-3a4db0879871',
      '16a5bd8a-e2ec-49af-b7c8-c02244b549de',
      'a616b2ec-77b1-4317-8848-d700ea9f5cfc',
      'd24cc865-7c3d-4862-96a0-8fe9358243e8',
      'bd5e7177-ff03-470c-aecb-ac898dca85e3',
      '368698e6-c3cc-4423-9bce-c3cb50d0b2d2',
    ]
    beforeEach(async () => {
      const mockList = jest
        .fn<PrismaPromise<CampaignDocumentRole[]>, []>()
        .mockResolvedValue(mockData)
      jest.spyOn(prismaService.campaignDocumentRole, 'findMany').mockImplementation(mockList)
    })
    it('should throw error when not found ids to remove', async () => {
      prismaService.campaignDocumentRole.deleteMany.mockRejectedValue(
        new Error('Document`s ids not found!'),
      )

      await expect(service.removeMany(idsToDell as [string])).rejects.toThrowWithMessage(
        NotFoundException,
        'Document`s ids not found!',
      )
    })
    it('should remove selected ids', async () => {
      const removeSelected = jest.spyOn(service, 'removeMany')
      await service.removeMany(idsToDell as [string])
      expect(removeSelected).toHaveBeenCalledWith(idsToDell)
      expect(idsToDell.map((id) => isUUID(id))).toEqual([true, true, true, true, true, true, true])
    })
  })
  describe('Update', () => {
    const data = {
      id: '1ccfac85-1cbd-445d-9619-78cbd6567a44',
      createdAt: '2022-03-14T09:42:39.259Z',
      updatedAt: '2022-03-14T09:42:39.260Z',
      name: 'todo',
      description: 'gdgf',
    }
    const id = '1ccfac85-1cbd-445d-9619-78cbd6567a44'
    it('should udate document', async () => {
      const update = jest.spyOn(service, 'update')
      await service.update(id, data)
      expect(update).toHaveBeenCalledWith(id, data)
      expect(isUUID(data.id)).toEqual(true)
    })
    it('sholud throw error when id not found', async () => {
      prismaService.campaignDocumentRole.update.mockRejectedValue(new Error('Document not found!'))
      await expect(service.update(id, data)).rejects.toThrowWithMessage(
        NotFoundException,
        'Document not found!',
      )
    })
  })
  describe('Create', () => {
    const data = {
      createdAt: '2022-03-14T09:42:39.259Z',
      updatedAt: '2022-03-14T09:42:39.260Z',
      name: '',
      description: 'gdgf',
    }
    it('should create task', async () => {
      const create = jest.spyOn(service, 'create')
      await service.create(data)
      expect(create).toHaveBeenCalledWith(data)
    })
    it('should throw error required empty field', async () => {
      prismaService.campaignDocumentRole.create.mockRejectedValue(new Error('Empty field'))
      await expect(service.create(data)).rejects.toThrowWithMessage(Error, 'Empty field')
    })
  })
})
