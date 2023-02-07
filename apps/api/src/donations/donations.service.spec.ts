import { STRIPE_CLIENT_TOKEN } from '@golevelup/nestjs-stripe'
import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { CampaignService } from '../campaign/campaign.service'
import { ExportService } from '../export/export.service'
import { PersonService } from '../person/person.service'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { WebSocketModule } from '../sockets/socket.module'
import { VaultModule } from '../vault/vault.module'
import { VaultService } from '../vault/vault.service'
import { DonationsService } from './donations.service'

describe('DonationsService', () => {
  let service: DonationsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [VaultModule, WebSocketModule],
      providers: [
        ConfigService,
        CampaignService,
        DonationsService,
        VaultService,
        MockPrismaService,
        {
          provide: STRIPE_CLIENT_TOKEN,
          useValue: jest.fn(),
        },
        PersonService,
        ExportService,
      ],
    }).compile()

    service = module.get<DonationsService>(DonationsService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
