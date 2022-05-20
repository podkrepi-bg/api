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
        issueTokenFromRefresh: jest.fn(() => ({})),
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
      expect(spyService.issueTokenFromRefresh).toHaveBeenCalled()
      expect(spyService.issueTokenFromRefresh).toHaveBeenCalledWith(providerDto)
    })
  })
})
