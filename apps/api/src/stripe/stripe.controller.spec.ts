import { StripeModule as ExtStripeModule, StripeModuleConfig } from '@golevelup/nestjs-stripe'
import { Test, TestingModule } from '@nestjs/testing'
import { StripeController } from './stripe.controller'
import { StripeService } from './stripe.service'

describe('StripeController', () => {
  let controller: StripeController

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
      controllers: [StripeController],
      providers: [StripeService],
    }).compile()

    controller = module.get<StripeController>(StripeController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
