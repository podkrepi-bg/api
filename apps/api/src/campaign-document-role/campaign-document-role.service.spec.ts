import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '../prisma/prisma.service'
import { CampaignDocumentRoleService } from './campaign-document-role.service'

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
})
