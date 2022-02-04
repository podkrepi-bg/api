import { Test, TestingModule } from '@nestjs/testing'
import { CoordinatorController } from './coordinator.controller'
import { CoordinatorService } from './coordinator.service'

describe('CoordinatorController', () => {
  let controller: CoordinatorController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoordinatorController],
      providers: [CoordinatorService],
    }).compile()

    controller = module.get<CoordinatorController>(CoordinatorController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
