import { mockDeep } from 'jest-mock-extended'
import { ConfigService } from '@nestjs/config'
import { plainToClass } from 'class-transformer'
import { Test, TestingModule } from '@nestjs/testing'
import KeycloakAdminClient from '@keycloak/keycloak-admin-client'

import { LoginDto } from './dto/login.dto'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'
import { PrismaService } from '../prisma/prisma.service'
import { prismaMock } from '../prisma/prisma-client.mock'

jest.mock('@keycloak/keycloak-admin-client')

describe('AuthService', () => {
  let service: AuthService
  let config: ConfigService
  let admin: KeycloakAdminClient

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
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
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
    config = module.get<ConfigService>(ConfigService)
    admin = module.get<KeycloakAdminClient>(KeycloakAdminClient)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('issueToken', () => {
    const email = 'someuser@example.com'
    const password = 's3cret'

    it('should call auth', async () => {
      admin.accessToken = 't23456'
      const tokenSpy = jest.spyOn(service, 'issueToken')
      expect(await service.issueToken(email, password)).toBe('t23456')
      expect(tokenSpy).toHaveBeenCalledWith(email, password)
      expect(config.get).toHaveBeenCalled()
      expect(config.get).toHaveBeenCalledWith('keycloak.clientId')
      expect(config.get).toHaveBeenCalledWith('keycloak.secret')
      expect(admin.auth).toHaveBeenCalledWith({
        clientId: 'realm-a12345',
        clientSecret: 'a12345',
        grantType: 'password',
        username: email,
        password,
      })
    })
  })

  describe('login', () => {
    const email = 'someuser@example.com'
    const password = 's3cret'

    it('should call issueToken', async () => {
      admin.accessToken = 't23456'
      const loginDto = plainToClass(LoginDto, { email, password })
      const loginSpy = jest.spyOn(service, 'login')
      const issueTokenSpy = jest.spyOn(service, 'issueToken')

      expect(await service.login(loginDto)).toBeObject()
      expect(loginSpy).toHaveBeenCalledWith(loginDto)
      expect(issueTokenSpy).toHaveBeenCalledWith(email, password)
      expect(admin.auth).toHaveBeenCalledWith({
        clientId: 'realm-a12345',
        clientSecret: 'a12345',
        grantType: 'password',
        username: email,
        password,
      })
    })

    it('should handle bad password on login', async () => {
      admin.accessToken = 't23456'
      const loginDto = plainToClass(LoginDto, { email, password })
      const loginSpy = jest.spyOn(service, 'login')
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const issueTokenSpy = jest.spyOn(service, 'issueToken').mockRejectedValue({
        message: 'Request failed with status code 401',
        response: {
          data: {
            error: 'invalid_grant',
            error_description: 'Invalid user credentials',
          },
        },
      })

      expect(await service.login(loginDto)).toEqual({
        error: 'Request failed with status code 401',
        data: {
          error: 'invalid_grant',
          error_description: 'Invalid user credentials',
        },
      })
      expect(loginSpy).toHaveBeenCalledWith(loginDto)
      expect(issueTokenSpy).toHaveBeenCalledWith(email, password)
      expect(consoleSpy).toBeCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('createUser', () => {
    const email = 'someuser@example.com'
    const password = 's3cret'
    const firstName = 'John'
    const lastName = 'Doe'

    it('should call keycloak and prisma', async () => {
      const keycloakId = 'u123'
      const registerDto = plainToClass(RegisterDto, { email, password, firstName, lastName })
      const createUserSpy = jest.spyOn(service, 'createUser')
      const adminSpy = jest.spyOn(admin.users, 'create').mockResolvedValue({ id: keycloakId })
      const person = {
        id: 'e43348aa-be33-4c12-80bf-2adfbf8736cd',
        firstName,
        lastName,
        keycloakId,
        email,
        emailConfirmed: false,
        phone: null,
        company: null,
        createdAt: new Date('2021-10-07T13:38:11.097Z'),
        updatedAt: new Date('2021-10-07T13:38:11.097Z'),
        newsletter: false,
        address: null,
        birthday: null,
        personalNumber: null,
      }
      const prismaSpy = jest.spyOn(prismaMock.person, 'upsert').mockResolvedValue(person)

      expect(await service.createUser(registerDto)).toBe(person)
      expect(createUserSpy).toHaveBeenCalledWith(registerDto)

      // Check keycloak creation
      expect(adminSpy).toHaveBeenCalledWith({
        username: email,
        email,
        firstName,
        lastName,
        enabled: true,
        emailVerified: true,
        groups: [],
        requiredActions: ['VERIFY_EMAIL'],
        attributes: {},
        credentials: [
          {
            type: 'password',
            value: password,
            temporary: false,
          },
        ],
      })

      // Check db creation
      expect(prismaSpy).toHaveBeenCalledWith({
        create: { keycloakId, email, firstName, lastName },
        update: { keycloakId },
        where: { email },
      })
    })

    it('should handle bad password on registration', async () => {
      admin.accessToken = 't23456'
      const registerDto = plainToClass(RegisterDto, { email, password, firstName, lastName })
      const createUserSpy = jest.spyOn(service, 'createUser')
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const adminSpy = jest.spyOn(admin.users, 'create').mockRejectedValue({
        message: 'Request failed with status code 409',
        response: {
          data: {
            errorMessage: 'User exists with same username',
          },
        },
      })

      expect(await service.createUser(registerDto)).toEqual({
        error: 'Request failed with status code 409',
        data: {
          errorMessage: 'User exists with same username',
        },
      })
      expect(createUserSpy).toHaveBeenCalledWith(registerDto)
      expect(adminSpy).toHaveBeenCalled()
      expect(consoleSpy).toBeCalled()
      consoleSpy.mockRestore()
    })
  })
})
