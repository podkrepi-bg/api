import { StripeModule as ExtStripeModule, StripeModuleConfig } from '@golevelup/nestjs-stripe'
import { Test, TestingModule } from '@nestjs/testing'
import { StripeService } from './stripe.service'

describe('StripeService', () => {
  let service: StripeService

  beforeEach(async () => {
    const stripeSecret = 'wh_123'
    const moduleConfig: StripeModuleConfig = {
      apiKey: stripeSecret,
      webhookConfig: {
        stripeSecrets: {
          account: stripeSecret,
        },
        loggingConfiguration: {
          logMatchingEventHandlers: true,
        },
      },
    }
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ExtStripeModule.forRootAsync(ExtStripeModule, {
          useFactory: () => moduleConfig,
        }),
      ],
      providers: [StripeService],
    }).compile()

    service = module.get<StripeService>(StripeService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
