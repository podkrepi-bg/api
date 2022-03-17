import { Test, TestingModule } from '@nestjs/testing'
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
})
