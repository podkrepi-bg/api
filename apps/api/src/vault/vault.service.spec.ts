import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { CampaignModule } from '../campaign/campaign.module'
import { CampaignService } from '../campaign/campaign.service'
import { PersonService } from '../person/person.service'
import { PrismaService } from '../prisma/prisma.service'
import { VaultService } from './vault.service'

describe('VaultService', () => {
  let service: VaultService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CampaignModule],
      providers: [VaultService, PrismaService, CampaignService, PersonService, ConfigService],
    }).compile()

    service = module.get<VaultService>(VaultService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
