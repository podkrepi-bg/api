import { Person } from '.prisma/client'
import { mockDeep } from 'jest-mock-extended'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import { plainToClass } from 'class-transformer'
import { Test, TestingModule } from '@nestjs/testing'
import { UnauthorizedException } from '@nestjs/common'
import KeycloakConnect, { Grant } from 'keycloak-connect'
import { KEYCLOAK_INSTANCE } from 'nest-keycloak-connect'
import KeycloakAdminClient from '@keycloak/keycloak-admin-client'
import { TokenResponseRaw } from '@keycloak/keycloak-admin-client/lib/utils/auth'

import { LoginDto } from './dto/login.dto'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'
import { MockPrismaService, prismaMock } from '../prisma/prisma-client.mock'
import { RefreshDto } from './dto/refresh.dto'
import { Observable } from 'rxjs'

jest.mock('@keycloak/keycloak-admin-client')

describe('AuthService', () => {
  let service: AuthService
  let config: ConfigService
  let admin: KeycloakAdminClient
  let httpService: HttpService
  let keycloak: KeycloakConnect.Keycloak

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
          provide: HttpService,
          useValue: mockDeep<HttpService>(),
        },
        MockPrismaService,
        {
          provide: KEYCLOAK_INSTANCE,
          useValue: mockDeep<KeycloakConnect.Keycloak>(),
        },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
    config = module.get<ConfigService>(ConfigService)
    admin = module.get<KeycloakAdminClient>(KeycloakAdminClient)
    keycloak = module.get<KeycloakConnect.Keycloak>(KEYCLOAK_INSTANCE)
    httpService = module.get<HttpService>(HttpService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('issueToken', () => {
    const email = 'someuser@example.com'
    const password = 's3cret'

    it('should call auth', async () => {
      const tokenSpy = jest.spyOn(service, 'issueToken')
      const token = mockDeep<Grant>({
        access_token: { token: 't23456' },
      })
      const keycloakSpy = jest
        .spyOn(keycloak.grantManager, 'obtainDirectly')
        .mockResolvedValue(token)
      expect(await service.issueToken(email, password)).toBe('t23456')
      expect(keycloakSpy).toHaveBeenCalledWith(email, password)
      expect(tokenSpy).toHaveBeenCalledWith(email, password)
      expect(admin.auth).not.toHaveBeenCalled()
    })
  })

  describe('refresh', () => {
    it('should call issueTokenFromRefresh', async () => {
      const refreshToken = 'JWT_TOKEN'
      const refreshDto = plainToClass(RefreshDto, { refreshToken })
      const refreshSpy = jest.spyOn(service, 'issueTokenFromRefresh').mockResolvedValue(new Observable((s => {
        s.next({} as TokenResponseRaw)
      })))

      expect(await service.issueTokenFromRefresh(refreshDto)).toBeObject()
      expect(refreshSpy).toHaveBeenCalledWith(refreshDto)
      expect(admin.auth).not.toHaveBeenCalled()
    })
  })

  describe('login', () => {
    const email = 'someuser@example.com'
    const password = 's3cret'

    it('should call issueGrant', async () => {
      const token = mockDeep<Grant>({
        access_token: { token: 't23456' },
      })
      const keycloakSpy = jest
        .spyOn(keycloak.grantManager, 'obtainDirectly')
        .mockResolvedValue(token)
      const loginDto = plainToClass(LoginDto, { email, password })
      const loginSpy = jest.spyOn(service, 'login')
      const issueGrantSpy = jest.spyOn(service, 'issueGrant')

      expect(await service.login(loginDto)).toBeObject()
      expect(loginSpy).toHaveBeenCalledWith(loginDto)
      expect(keycloakSpy).toHaveBeenCalledWith(email, password)
      expect(issueGrantSpy).toHaveBeenCalledWith(email, password)
      expect(admin.auth).not.toHaveBeenCalled()
    })

    it('should handle bad password on login', async () => {
      const keycloakSpy = jest
        .spyOn(keycloak.grantManager, 'obtainDirectly')
        .mockRejectedValue(new Error('401:Unauthorized'))
      const loginDto = plainToClass(LoginDto, { email, password })
      const loginSpy = jest.spyOn(service, 'login')
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const issueGrantSpy = jest.spyOn(service, 'issueGrant')

      try {
        await service.login(loginDto)
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException)
        expect(error.message).toBe('401:Unauthorized')
      }

      expect(loginSpy).toHaveBeenCalledWith(loginDto)
      expect(issueGrantSpy).toHaveBeenCalledWith(email, password)
      expect(keycloakSpy).toHaveBeenCalledWith(email, password)
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
      const person: Person = {
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
        stripeCustomerId: null,
      }
      const prismaSpy = jest.spyOn(prismaMock.person, 'upsert').mockResolvedValue(person)

      expect(await service.createUser(registerDto)).toBe(person)
      expect(createUserSpy).toHaveBeenCalledWith(registerDto)

      expect(config.get).toHaveBeenCalled()
      expect(config.get).toHaveBeenCalledWith('keycloak.clientId')
      expect(config.get).toHaveBeenCalledWith('keycloak.secret')
      expect(admin.auth).toHaveBeenCalledWith({
        clientId: 'realm-a12345',
        clientSecret: 'a12345',
        grantType: 'client_credentials',
      })

      // Check keycloak creation
      expect(adminSpy).toHaveBeenCalledWith({
        username: email,
        email,
        firstName,
        lastName,
        enabled: true,
        emailVerified: true,
        groups: [],
        requiredActions: [],
        attributes: { selfReg: true },
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
