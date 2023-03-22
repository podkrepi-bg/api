import { Test, TestingModule } from '@nestjs/testing'
import { StripeController } from './stripe.controller'

describe('StripeController', () => {
  let controller: StripeController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StripeController],
    }).compile()

    controller = module.get<StripeController>(StripeController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
