import { Test, TestingModule } from '@nestjs/testing'

import { AuthService } from './auth.service'
import { LoginController } from './login.controller'
import { LoginDto } from './dto/login.dto'

describe('LoginController', () => {
  let controller: LoginController
  let spyService: AuthService

  beforeEach(async () => {
    const AuthServiceProvider = {
      provide: AuthService,
      useFactory: () => ({
        issueToken: jest.fn(() => ''),
        login: jest.fn(() => ({})),
        createUser: jest.fn(() => ({})),
      }),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoginController],
      providers: [AuthService, AuthServiceProvider],
    }).compile()

    controller = module.get<LoginController>(LoginController)
    spyService = module.get<AuthService>(AuthService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('createUser', () => {
    const loginDto = new LoginDto()
    it('should call createUser', async () => {
      expect(await controller.login(loginDto))
      expect(spyService.login).toHaveBeenCalled()
      expect(spyService.login).toHaveBeenCalledWith(loginDto)
    })
  })
})
