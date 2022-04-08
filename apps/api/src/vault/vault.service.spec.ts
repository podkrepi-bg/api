import { Test, TestingModule } from '@nestjs/testing'
import { CampaignModule } from '../campaign/campaign.module'
import { CampaignService } from '../campaign/campaign.service'
import { PrismaService } from '../prisma/prisma.service'
import { VaultService } from './vault.service'

describe('VaultService', () => {
  let service: VaultService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CampaignModule],
      providers: [VaultService, PrismaService, CampaignService],
    }).compile()

    service = module.get<VaultService>(VaultService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
