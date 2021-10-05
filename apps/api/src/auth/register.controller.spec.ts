import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from './auth.service'
import { RegisterController } from './register.controller'

describe('RegisterController', () => {
  let controller: RegisterController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegisterController],
      providers: [AuthService],
    }).compile()

    controller = module.get<RegisterController>(RegisterController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
