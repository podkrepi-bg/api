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
})
