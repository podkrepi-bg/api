import KeycloakAdminClient from '@keycloak/keycloak-admin-client'
import { HttpService } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { mock, mockDeep } from 'jest-mock-extended'
import KeycloakConnect from 'keycloak-connect'
import { KEYCLOAK_INSTANCE } from 'nest-keycloak-connect'
import { AuthService } from '../auth/auth.service'
import { EmailService } from '../email/email.service'
import { PersonService } from '../person/person.service'
import { MockPrismaService } from '../prisma/prisma-client.mock'
import { AccountService } from './account.service'

import { MarketingNotificationsModule } from '../notifications/notifications.module'

describe('AccountService', () => {
  let service: AccountService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [MarketingNotificationsModule],
      providers: [
        AccountService,
        PersonService,
        MockPrismaService,
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
        {
          provide: JwtService,
          useValue: mockDeep<JwtService>(),
        },
        {
          provide: EmailService,
          useValue: mockDeep<EmailService>(),
        },
      ],
    }).compile()

    service = module.get<AccountService>(AccountService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
