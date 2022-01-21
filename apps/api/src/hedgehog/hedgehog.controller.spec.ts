import { Test, TestingModule } from '@nestjs/testing'
import { HedgehogController } from './hedgehog.controller'
import { HedgehogService } from './hedgehog.service'

describe('HedgehogController', () => {
  let controller: HedgehogController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HedgehogController],
      providers: [HedgehogService],
    }).compile()

    controller = module.get<HedgehogController>(HedgehogController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
