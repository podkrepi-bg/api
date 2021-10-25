import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { STRIPE_CLIENT_TOKEN } from '@golevelup/nestjs-stripe'

import { DonationsService } from './donations.service'
import { PrismaService } from '../prisma/prisma.service'
import { prismaMock } from '../prisma/prisma-client.mock'
import { DonationsController } from './donations.controller'
import { CampaignService } from '../campaign/campaign.service'

describe('DonationsController', () => {
  let controller: DonationsController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DonationsController],
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

    controller = module.get<DonationsController>(DonationsController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
