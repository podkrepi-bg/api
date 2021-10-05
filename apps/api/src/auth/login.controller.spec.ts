import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from './auth.service'
import { LoginController } from './login.controller'

describe('LoginController', () => {
  let controller: LoginController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoginController],
      providers: [AuthService],
    }).compile()

    controller = module.get<LoginController>(LoginController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
