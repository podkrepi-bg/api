import { Test, TestingModule } from '@nestjs/testing'
import { PaypalController } from './paypal.controller'
import { PaypalService } from './paypal.service'
import { ConfigModule } from '@nestjs/config'
import { HttpModule } from '@nestjs/axios'
import { CampaignService } from '../campaign/campaign.service'
import { DonationsService } from '../donations/donations.service'

describe('PaypalController', () => {
  let controller: PaypalController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, HttpModule],
      controllers: [PaypalController],
      providers: [
        PaypalService,
        {
          provide: CampaignService,
          useValue: {},
        },
        {
          provide: DonationsService,
          useValue: {},
        },
      ],
    }).compile()

    controller = module.get<PaypalController>(PaypalController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
