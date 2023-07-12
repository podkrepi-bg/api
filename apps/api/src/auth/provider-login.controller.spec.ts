import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from './auth.service'
import { ProviderDto } from './dto/provider.dto'
import { ProviderLoginController } from './provider-login.controller'

describe('ProviderLoginController', () => {
  let controller: ProviderLoginController
  let spyService: AuthService

  beforeEach(async () => {
    const AuthServiceProvider = {
      provide: AuthService,
      useFactory: () => ({
        issueTokenFromProvider: jest.fn(() => ({
          accessToken: 'SOME_JWT_TOKEN',
          refreshToken: 'SOME_REFRESH_TOKEN',
          expires: 300,
        })),
      }),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProviderLoginController],
      providers: [AuthService, AuthServiceProvider],
    }).compile()

    controller = module.get<ProviderLoginController>(ProviderLoginController)
    spyService = module.get<AuthService>(AuthService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('refreshToken', () => {
    const providerDto = new ProviderDto()
    it('should call refreshToken', async () => {
      expect(await controller.providerLogin(providerDto))
      expect(spyService.issueTokenFromProvider).toHaveBeenCalled()
      expect(spyService.issueTokenFromProvider).toHaveBeenCalledWith(providerDto)
    })
  })
})
