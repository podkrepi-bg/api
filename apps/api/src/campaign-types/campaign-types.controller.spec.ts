import { Test, TestingModule } from '@nestjs/testing'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { CampaignTypesController } from './campaign-types.controller'
import { CampaignTypesService } from './campaign-types.service'

describe('CampaignTypesController', () => {
  let controller: CampaignTypesController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CampaignTypesController],
      providers: [CampaignTypesService, MockPrismaService],
    }).compile()

    controller = module.get<CampaignTypesController>(CampaignTypesController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
