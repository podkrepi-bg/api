import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '../prisma/prisma.service'
import { CampaignTypesService } from './campaign-types.service'

describe('CampaignTypesService', () => {
  let service: CampaignTypesService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CampaignTypesService, PrismaService],
    }).compile()

    service = module.get<CampaignTypesService>(CampaignTypesService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
