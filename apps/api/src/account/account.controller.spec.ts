import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { PersonService } from '../person/person.service'
import { MockPrismaService, prismaMock } from '../prisma/prisma-client.mock'
import { AccountController } from './account.controller'
import { AccountService } from './account.service'
import { KeycloakTokenParsed } from '../auth/keycloak'
import { AuthService } from '../auth/auth.service'
import KeycloakAdminClient from '@keycloak/keycloak-admin-client'
import { HttpService } from '@nestjs/axios'
import { KEYCLOAK_INSTANCE } from 'nest-keycloak-connect'
import KeycloakConnect from 'keycloak-connect'
import { mock, mockDeep } from 'jest-mock-extended'

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
      providers: [
        AccountService,
        PersonService,
        MockPrismaService,
        ConfigService,
        AuthService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'keycloak.clientId') return 'realm-a12345'
              if (key === 'keycloak.secret') return 'a12345'
              return null
            }),
          },
        },
        {
          provide: KeycloakAdminClient,
          useValue: mockDeep<KeycloakAdminClient>(),
        },
        {
          provide: HttpService,
          useValue: mockDeep<HttpService>(),
        },
        MockPrismaService,
        {
          provide: KEYCLOAK_INSTANCE,
          useValue: mock<KeycloakConnect.Keycloak>(),
        },
      ],
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
