import { Test, TestingModule } from '@nestjs/testing'

import { AuthService } from './auth.service'
import { RegisterController } from './register.controller'
import { RegisterDto } from './dto/register.dto'

describe('RegisterController', () => {
  let controller: RegisterController
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
      controllers: [RegisterController],
      providers: [AuthService, AuthServiceProvider],
    }).compile()

    controller = module.get<RegisterController>(RegisterController)
    spyService = module.get<AuthService>(AuthService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('createUser', () => {
    const registerDto = new RegisterDto()
    it('should call createUser', async () => {
      expect(await controller.register(registerDto))
      expect(spyService.createUser).toHaveBeenCalled()
      expect(spyService.createUser).toHaveBeenCalledWith(registerDto)
    })
  })
})
