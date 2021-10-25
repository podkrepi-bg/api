import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { STRIPE_CLIENT_TOKEN } from '@golevelup/nestjs-stripe'

import { DonationsService } from './donations.service'
import { PrismaService } from '../prisma/prisma.service'
import { prismaMock } from '../prisma/prisma-client.mock'
import { CampaignService } from '../campaign/campaign.service'

describe('DonationsService', () => {
  let service: DonationsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        CampaignService,
        DonationsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: STRIPE_CLIENT_TOKEN,
          useValue: jest.fn(),
        },
      ],
    }).compile()

    service = module.get<DonationsService>(DonationsService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
