import { HttpModule } from '@nestjs/axios'
import { ConfigModule } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { CampaignService } from '../campaign/campaign.service'
import { DonationsService } from '../donations/donations.service'
import { PaypalService } from './paypal.service'

describe('PaypalService', () => {
  let service: PaypalService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, HttpModule],
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

    service = module.get<PaypalService>(PaypalService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
