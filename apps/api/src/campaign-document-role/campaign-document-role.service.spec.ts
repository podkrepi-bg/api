import { Test, TestingModule } from '@nestjs/testing'
import { prismaMock } from '../prisma/prisma-client.mock'
import { PrismaService } from '../prisma/prisma.service'
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

describe('CampaignDocumentRoleService', () => {
  let service: CampaignDocumentRoleService
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CampaignDocumentRoleService, PrismaService],
    }).compile()

    service = module.get<CampaignDocumentRoleService>(CampaignDocumentRoleService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
  // it('should return all documents', async () => {
  //   prismaMock.campaignDocumentRole.findMany.mockResolvedValue(mockData)
  //   await expect(service.findAll()).resolves.toEqual(mockData)
  // })
})
