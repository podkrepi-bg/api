import { STRIPE_CLIENT_TOKEN } from '@golevelup/nestjs-stripe'
import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { CampaignService } from '../campaign/campaign.service'
import { PersonService } from '../person/person.service'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { VaultService } from '../vault/vault.service'
import { DonationsController } from './donations.controller'
import { DonationsService } from './donations.service'

describe('DonationsController', () => {
  let controller: DonationsController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DonationsController],
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
        PersonService
      ],
    }).compile()

    controller = module.get<DonationsController>(DonationsController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
