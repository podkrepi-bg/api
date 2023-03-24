import { StripeModule } from '@golevelup/nestjs-stripe'
import { Test, TestingModule } from '@nestjs/testing'
import { DonationsModule } from '../donations/donations.module'
import { StripeService } from './stripe.service'

describe('StripeService', () => {
  let service: StripeService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [StripeModule, DonationsModule],
      providers: [StripeService],
    }).compile()

    service = module.get<StripeService>(StripeService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
