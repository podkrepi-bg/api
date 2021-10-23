import { Test, TestingModule } from '@nestjs/testing'
import { DonationsController } from './donations.controller'
import { DonationsService } from './donations.service'

describe('DonationsController', () => {
  let controller: DonationsController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DonationsController],
      providers: [DonationsService],
    }).compile()

    controller = module.get<DonationsController>(DonationsController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
