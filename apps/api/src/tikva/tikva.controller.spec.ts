import { Test, TestingModule } from '@nestjs/testing'
import { TikvaController } from './tikva.controller'
import { TikvaService } from './tikva.service'

describe('TikvaController', () => {
  let controller: TikvaController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TikvaController],
      providers: [TikvaService],
    }).compile()

    controller = module.get<TikvaController>(TikvaController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
