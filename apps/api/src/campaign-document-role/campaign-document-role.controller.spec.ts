import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '../prisma/prisma.service'
import { CampaignDocumentRoleController } from './campaign-document-role.controller'
import { CampaignDocumentRoleService } from './campaign-document-role.service'

const mockData = [
  {
    id: '5f9221cf-f067-4011-8d2a-66b59509fb7b',
    name: 'Bobby',
    description: '',
  },
  {
    id: 'dc7c8d51-732a-4b82-a87e-f62a9c2e9a68',
    name: 'image',
    description: '',
  },
  {
    id: 'dc7c8d51-732a-4b82-a87e-f62a9c2e9a99',
    name: 'image',
    description: '',
  },
]

describe('CampaignDocumentRoleController', () => {
  let controller: CampaignDocumentRoleController

  const mockCampaignDocumentRoleService = {
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
    }),
    removeMany: jest.fn((ids) => {
      return mockData.filter((task) => !ids.includes(task.id))
    }),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CampaignDocumentRoleController],
      providers: [CampaignDocumentRoleService, PrismaService],
    })
      .overrideProvider(CampaignDocumentRoleService)
      .useValue(mockCampaignDocumentRoleService)
      .compile()

    controller = module.get<CampaignDocumentRoleController>(CampaignDocumentRoleController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
  it('should create document', () => {
    const result = controller.create({
      name: 'todo',
      description: 'Opravi si zadachata',
    })
    const expected = {
      id: expect.any(Number),
      name: 'todo',
      description: 'Opravi si zadachata',
    }
    expect(result).toEqual(expected)
    expect(mockCampaignDocumentRoleService.create).toHaveBeenCalled()
  })
  it('should return all documents', () => {
    const result = controller.findAll()
    expect(result).toHaveLength(3)
    expect(result).toEqual(mockData)
    expect(mockCampaignDocumentRoleService.findAll).toHaveBeenCalled()
  })
  it('should update a document', () => {
    const dto = {
      name: 'todo',
      description: 'Opravi si zadachata',
    }
    expect(controller.update('1', dto)).toEqual({
      id: '1',
      ...dto,
    })
    expect(mockCampaignDocumentRoleService.update).toHaveBeenCalledWith('1', dto)
  })
  it('should return one document', () => {
    const result = controller.findOne('5f9221cf-f067-4011-8d2a-66b59509fb7b')
    const expected = mockData[0]
    expect(result).toEqual(expected)
    expect(mockCampaignDocumentRoleService.findOne).toHaveBeenCalledWith(
      '5f9221cf-f067-4011-8d2a-66b59509fb7b',
    )
  })
  it('should delete one document', () => {
    const result = controller.remove('5f9221cf-f067-4011-8d2a-66b59509fb7b')
    expect(result).toHaveLength(2)
    expect(mockCampaignDocumentRoleService.remove).toHaveBeenCalledWith(
      '5f9221cf-f067-4011-8d2a-66b59509fb7b',
    )
  })
  it('should delete many documents', () => {
    const toDell = ['dc7c8d51-732a-4b82-a87e-f62a9c2e9a68', 'dc7c8d51-732a-4b82-a87e-f62a9c2e9a99']
    const result = controller.removeMany(toDell as [string])
    const expected = [
      {
        id: '5f9221cf-f067-4011-8d2a-66b59509fb7b',
        name: 'Bobby',
        description: '',
      },
    ]
    expect(result).toEqual(expected)
    expect(mockCampaignDocumentRoleService.removeMany).toHaveBeenCalledWith(toDell)
  })
})
