import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '../prisma/prisma.service'
import { CampaignTypesController } from './campaign-types.controller'
import { CampaignTypesService } from './campaign-types.service'

describe('CampaignTypesController', () => {
  let controller: CampaignTypesController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CampaignTypesController],
      providers: [CampaignTypesService, PrismaService],
    }).compile()

    controller = module.get<CampaignTypesController>(CampaignTypesController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
