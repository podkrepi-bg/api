import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { RefreshDto } from './dto/refresh.dto';
import { RefreshController } from './refresh.controller';

describe('RefreshController', () => {
  let controller: RefreshController
  let spyService: AuthService

  beforeEach(async () => {
    const AuthServiceProvider = {
      provide: AuthService,
      useFactory: () => ({
        issueTokenFromRefresh: jest.fn(() => ({})),
      }),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RefreshController],
      providers: [AuthService, AuthServiceProvider],
    }).compile()

    controller = module.get<RefreshController>(RefreshController)
    spyService = module.get<AuthService>(AuthService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('refreshToken', () => {
    const refreshDto = new RefreshDto()
    it('should call refreshToken', async () => {
      expect(await controller.refresh(refreshDto))
      expect(spyService.issueTokenFromRefresh).toHaveBeenCalled()
      expect(spyService.issueTokenFromRefresh).toHaveBeenCalledWith(refreshDto)
    })
  })
})
