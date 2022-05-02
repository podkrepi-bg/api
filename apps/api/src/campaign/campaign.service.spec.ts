import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { PersonService } from '../person/person.service'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { VaultModule } from '../vault/vault.module'
import { VaultService } from '../vault/vault.service'
import { CampaignService } from './campaign.service'

describe('CampaignService', () => {
  let service: CampaignService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [VaultModule],
      providers: [CampaignService, MockPrismaService, VaultService, PersonService, ConfigService],
    }).compile()

    service = module.get<CampaignService>(CampaignService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
