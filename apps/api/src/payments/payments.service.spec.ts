import { Test, TestingModule } from '@nestjs/testing'
import { PaymentsService } from './payments.service'

describe('PaymentsService', () => {
  let service: PaymentsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentsService],
    }).compile()

    service = module.get<PaymentsService>(PaymentsService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
