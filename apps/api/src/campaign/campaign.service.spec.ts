import { Test, TestingModule } from '@nestjs/testing'

import { CampaignService } from './campaign.service'
import { PrismaService } from '../prisma/prisma.service'
import { prismaMock } from '../prisma/prisma-client.mock'

describe('CampaignService', () => {
  let service: CampaignService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile()

    service = module.get<CampaignService>(CampaignService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
