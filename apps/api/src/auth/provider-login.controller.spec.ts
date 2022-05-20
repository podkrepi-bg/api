import { Test, TestingModule } from '@nestjs/testing'
import { ProviderLoginController } from './provider-login.controller'

describe('ProviderLoginController', () => {
  let controller: ProviderLoginController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProviderLoginController],
    }).compile()

    controller = module.get<ProviderLoginController>(ProviderLoginController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
