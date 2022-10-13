import { Test, TestingModule } from '@nestjs/testing'
import { PaypalController } from './paypal.controller'
import { PaypalService } from './paypal.service'
import { PaypalModule } from './paypal.module'
import { CampaignModule } from '../campaign/campaign.module'
import { ConfigModule } from '@nestjs/config'
import { HttpModule } from '@nestjs/axios'

describe('PaypalController', () => {
  let controller: PaypalController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PaypalModule, CampaignModule, ConfigModule, HttpModule],
      controllers: [PaypalController],
      providers: [PaypalService],
    }).compile()

    controller = module.get<PaypalController>(PaypalController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
