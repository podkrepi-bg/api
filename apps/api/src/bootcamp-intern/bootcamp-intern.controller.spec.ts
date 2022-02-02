import { Test, TestingModule } from '@nestjs/testing'
import { BootcampInternController } from './bootcamp-intern.controller'
import { BootcampInternService } from './bootcamp-intern.service'

describe('BootcampInternController', () => {
  let controller: BootcampInternController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BootcampInternController],
      providers: [BootcampInternService],
    }).compile()

    controller = module.get<BootcampInternController>(BootcampInternController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
