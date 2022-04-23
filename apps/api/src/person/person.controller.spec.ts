import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { MockPrismaService, prismaMock } from '../prisma/prisma-client.mock'
import { PersonController } from './person.controller'
import { PersonService } from './person.service'
import { KeycloakTokenParsed } from '../auth/keycloak'

describe('PersonController', () => {
  let controller: PersonController

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
      controllers: [PersonController],
      providers: [PersonService, MockPrismaService, ConfigService],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn((key: string) => {
          return key === 'sendgrid.apiKey' ? 'SG.test' : 'testUrl'
        }),
      })
      .compile()

    controller = module.get<PersonController>(PersonController)
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
