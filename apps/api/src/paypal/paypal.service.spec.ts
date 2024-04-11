import { HttpModule } from '@nestjs/axios'
import { ConfigModule } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { CampaignModule } from '../campaign/campaign.module'
import { NotificationModule } from '../sockets/notifications/notification.module'
import { PaypalModule } from './paypal.module'
import { PaypalService } from './paypal.service'
import { MarketingNotificationsModule } from '../notifications/notifications.module'
import { DonationsModule } from '../donations/donations.module'
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager'

describe('PaypalService', () => {
  let service: PaypalService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        CacheModule.register({ isGlobal: true }),
        PaypalModule,
        ConfigModule,
        HttpModule,
        DonationsModule,
        CampaignModule,
        NotificationModule,
        MarketingNotificationsModule,
        CacheModule.register(),
      ],
      providers: [PaypalService, { provide: CACHE_MANAGER, useValue: {} }],
    }).compile()

    service = module.get<PaypalService>(PaypalService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
