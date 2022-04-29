import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { PersonService } from '../person/person.service'
import { MockPrismaService, prismaMock } from '../prisma/prisma-client.mock'
import { AccountController } from './account.controller'
import { AccountService } from './account.service'
import { KeycloakTokenParsed } from '../auth/keycloak'

describe('AccountController', () => {
  let controller: AccountController

  const userMock = {
    sub: 'testKeycloackId',
    resource_access: { account: { roles: [] } },
    given_name: 'Test',
    family_name: 'User',
    email: 'test@test.com',
    'allowed-origins': [],
  } as KeycloakTokenParsed

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountController],
      providers: [AccountService, PersonService, MockPrismaService, ConfigService],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn((key: string) => {
          return key === 'sendgrid.apiKey' ? 'SG.test' : 'testUrl'
        }),
      })
      .compile()

    controller = module.get<AccountController>(AccountController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should create person for authenticated user', async () => {
    await controller.register(userMock)
    expect(prismaMock.person.create).toHaveBeenCalledWith({
      data: {
        firstName: userMock.given_name,
        lastName: userMock.family_name,
        email: userMock.email,
        keycloakId: userMock.sub,
      },
    })
  })
})
