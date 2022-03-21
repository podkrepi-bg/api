import { Test, TestingModule } from '@nestjs/testing'
import { CampaignDocumentRole, PrismaPromise } from '@prisma/client'
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

type data = {
  id: string
  createdAt: Date
  updatedAt: Date
  name: string
  description: string
}

describe('CampaignDocumentRoleService', () => {
  let service: CampaignDocumentRoleService
  let prismaService = prismaMock
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
  // it.only('should return searching document', async () => {
  //   const mockList = jest
  //     .fn<PrismaPromise<CampaignDocumentRole[]>, []>()
  //     .mockResolvedValue(mockData)

  //   jest
  //     .spyOn(prismaService.campaignDocumentRole, 'findFirst')
  //     .mockResolvedValue(mockList.call('kkk'))

  //   expect(await service.findOne('5f9221cf-f067-4011-8d2a-66b59509fb7b')).toEqual(mockData[1])
  // await expect(prismaService.campaignDocumentRole.findFirst()).resolves.toHaveBeenCalledWith(
  //   mockData[1],
  // )
  // await expect(service.findOne('dc7c8d51-732a-4b82-a87e-f62a9c2e9a68')).resolves.toEqual(
  //   mockData[1],
  // )
  // })
})
