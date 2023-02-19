import { HttpModule } from '@nestjs/axios'
import { ConfigModule } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { CampaignModule } from '../campaign/campaign.module'
import { NotificationModule } from '../sockets/notifications/notification.module'
import { PaypalModule } from './paypal.module'
import { PaypalService } from './paypal.service'

describe('PaypalService', () => {
  let service: PaypalService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PaypalModule, CampaignModule, ConfigModule, HttpModule, NotificationModule],
      providers: [PaypalService],
    }).compile()

    service = module.get<PaypalService>(PaypalService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
