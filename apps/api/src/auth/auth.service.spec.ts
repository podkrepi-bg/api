import { Person } from '@prisma/client'
import { mockDeep } from 'jest-mock-extended'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import { plainToClass } from 'class-transformer'
import { Test, TestingModule } from '@nestjs/testing'
import { Logger, UnauthorizedException } from '@nestjs/common'
import KeycloakConnect, { Grant } from 'keycloak-connect'
import { KEYCLOAK_INSTANCE } from 'nest-keycloak-connect'
import KeycloakAdminClient from '@keycloak/keycloak-admin-client'

import { LoginDto } from './dto/login.dto'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'
import { MockPrismaService, prismaMock } from '../prisma/prisma-client.mock'
import { RefreshDto } from './dto/refresh.dto'
import { firstValueFrom, Observable } from 'rxjs'
import { ProviderDto } from './dto/provider.dto'
import { EmailService } from '../email/email.service'
import { JwtService } from '@nestjs/jwt'
import { TemplateService } from '../email/template.service'

import { SendGridNotificationsProvider } from '../notifications/providers/notifications.sendgrid.provider'
import { NotificationsProviderInterface } from '../notifications/providers/notifications.interface.providers'
import { MarketingNotificationsModule } from '../notifications/notifications.module'

jest.mock('@keycloak/keycloak-admin-client')

describe('AuthService', () => {
  let service: AuthService
  let config: ConfigService
  let admin: KeycloakAdminClient
  let keycloak: KeycloakConnect.Keycloak
  let marketing: NotificationsProviderInterface<unknown>

  const person: Person = {
    id: 'e43348aa-be33-4c12-80bf-2adfbf8736cd',
    firstName: 'Admin',
    lastName: 'Dev',
    keycloakId: '123',
    email: 'test@podkrepi.bg',
    emailConfirmed: false,
    phone: null,
    company: null,
    picture: null,
    createdAt: new Date('2021-10-07T13:38:11.097Z'),
    updatedAt: new Date('2021-10-07T13:38:11.097Z'),
    newsletter: false,
    address: null,
    birthday: null,
    personalNumber: null,
    stripeCustomerId: null,
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [MarketingNotificationsModule],
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'keycloak.clientId') return 'realm-a12345'
              if (key === 'keycloak.secret') return 'a12345'
              if (key === 'sendgrid.marketingListId') return 'list-id'
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
        {
          provide: JwtService,
          useValue: mockDeep<JwtService>(),
        },
        {
          provide: EmailService,
          useValue: mockDeep<EmailService>(),
        },
        {
          provide: TemplateService,
          useValue: mockDeep<TemplateService>(),
        },
        {
          provide: NotificationsProviderInterface,
          useClass: SendGridNotificationsProvider,
        },
      ],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn((key: string) => {
          if (key === 'keycloak.clientId') return 'realm-a12345'
          if (key === 'keycloak.secret') return 'a12345'
          if (key === 'sendgrid.marketingListId') return 'list-id'
          return null
        }),
      })
      .compile()

    service = module.get<AuthService>(AuthService)
    config = module.get<ConfigService>(ConfigService)
    admin = module.get<KeycloakAdminClient>(KeycloakAdminClient)
    marketing = module.get<NotificationsProviderInterface<never>>(NotificationsProviderInterface)
    keycloak = module.get<KeycloakConnect.Keycloak>(KEYCLOAK_INSTANCE)
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

  describe('token endpoint', () => {
    it('should call tokenEndpoint', async () => {
      const data = {
        grant_type: 'test-grant',
        token: 'test-token',
      }
      const tokenEndpointSpy = jest.spyOn(service, 'tokenEndpoint').mockResolvedValue(
        new Observable((s) => {
          s.next({
            accessToken: 'test',
            refreshToken: 'test-refresh',
            expires: '300',
          })
        }),
      )
      expect(await firstValueFrom(await service.tokenEndpoint(data))).toHaveProperty('accessToken')
      expect(tokenEndpointSpy).toHaveBeenCalledWith(data)
      expect(admin.auth).not.toHaveBeenCalled()
    })
  })

  describe('refresh', () => {
    it('should call issueTokenFromRefresh', async () => {
      const refreshToken = 'JWT_TOKEN'
      const refreshDto = plainToClass(RefreshDto, { refreshToken })
      const refreshSpy = jest.spyOn(service, 'issueTokenFromRefresh').mockResolvedValue(
        new Observable((s) => {
          s.next({
            accessToken: 'test',
            refreshToken: 'test-refresh',
            expires: '300',
          })
        }),
      )

      expect(await firstValueFrom(await service.issueTokenFromRefresh(refreshDto))).toHaveProperty(
        'accessToken',
      )
      expect(refreshSpy).toHaveBeenCalledWith(refreshDto)
      expect(admin.auth).not.toHaveBeenCalled()
    })
  })

  describe('provider token call', () => {
    it('should call issueTokenFromProvider', async () => {
      const providerToken = 'JWT_TOKEN'
      const picture = 'http://image.com'
      const provider = 'test-provider'
      const providerDto = plainToClass(ProviderDto, { provider, providerToken, picture })
      const providerSpy = jest.spyOn(service, 'issueTokenFromProvider').mockResolvedValue(
        new Observable((s) => {
          s.next({
            accessToken: 'test',
            refreshToken: 'test-refresh',
            expires: '300',
          })
        }),
      )

      expect(
        await firstValueFrom(await service.issueTokenFromProvider(providerDto)),
      ).toHaveProperty('accessToken')
      expect(providerSpy).toHaveBeenCalledWith(providerDto)
      expect(admin.auth).not.toHaveBeenCalled()
    })
  })

  describe('login', () => {
    const email = person.email ?? ''
    const firstName = person.firstName ?? ''
    const lastName = person.lastName ?? ''
    const password = 's3cret'
    const keycloakId = person.keycloakId ?? '123'

    it('should call issueGrant - without updating person', async () => {
      const token = mockDeep<Grant>({
        access_token: {
          token: 't23456',
          content: { email: email, given_name: firstName, family_name: lastName, sub: keycloakId },
        },
      })
      const keycloakSpy = jest
        .spyOn(keycloak.grantManager, 'obtainDirectly')
        .mockResolvedValue(token)
      const loginDto = plainToClass(LoginDto, { email, password })
      const loginSpy = jest.spyOn(service, 'login')
      const issueGrantSpy = jest.spyOn(service, 'issueGrant')
      const userInfoSpy = jest
        .spyOn(keycloak.grantManager, 'userInfo')
        .mockResolvedValue(token.access_token?.content)

      prismaMock.person.findUnique.mockResolvedValue(person)
      expect(await service.login(loginDto)).toBeObject()
      expect(loginSpy).toHaveBeenCalledWith(loginDto)
      expect(keycloakSpy).toHaveBeenCalledWith(email, password)
      expect(issueGrantSpy).toHaveBeenCalledWith(email, password)
      expect(userInfoSpy).toHaveBeenCalledWith(token.access_token?.token)
      expect(admin.auth).not.toHaveBeenCalled()
    })

    it('should call issueGrant - with updating person due to keycloak mismatch', async () => {
      const token = mockDeep<Grant>({
        access_token: {
          token: 't23456',
          content: { email: email, given_name: firstName, family_name: lastName, sub: '1234' },
        },
      })
      const keycloakSpy = jest
        .spyOn(keycloak.grantManager, 'obtainDirectly')
        .mockResolvedValue(token)
      const loginDto = plainToClass(LoginDto, { email, password })
      const loginSpy = jest.spyOn(service, 'login')
      const issueGrantSpy = jest.spyOn(service, 'issueGrant')
      const userInfoSpy = jest
        .spyOn(keycloak.grantManager, 'userInfo')
        .mockResolvedValue(token.access_token?.content)
      const createPersonSpy = jest.spyOn(Object.getPrototypeOf(service), 'createPerson')

      prismaMock.person.findUnique.mockResolvedValue(person)
      expect(await service.login(loginDto)).toBeObject()
      expect(loginSpy).toHaveBeenCalledWith(loginDto)
      expect(keycloakSpy).toHaveBeenCalledWith(email, password)
      expect(issueGrantSpy).toHaveBeenCalledWith(email, password)
      expect(userInfoSpy).toHaveBeenCalledWith(token.access_token?.token)
      expect(admin.auth).toHaveBeenCalled()
      expect(createPersonSpy).toHaveBeenCalled()
    })

    it('should call issueGrant - with creating person due to not being found', async () => {
      const token = mockDeep<Grant>({
        access_token: {
          token: 't23456',
          content: { email: email, given_name: firstName, family_name: lastName, sub: '1234' },
        },
      })
      const keycloakSpy = jest
        .spyOn(keycloak.grantManager, 'obtainDirectly')
        .mockResolvedValue(token)
      const loginDto = plainToClass(LoginDto, { email, password })
      const loginSpy = jest.spyOn(service, 'login')
      const issueGrantSpy = jest.spyOn(service, 'issueGrant')
      const userInfoSpy = jest
        .spyOn(keycloak.grantManager, 'userInfo')
        .mockResolvedValue(token.access_token?.content)
      const createPersonSpy = jest.spyOn(Object.getPrototypeOf(service), 'createPerson')

      expect(await service.login(loginDto)).toBeObject()
      expect(loginSpy).toHaveBeenCalledWith(loginDto)
      expect(keycloakSpy).toHaveBeenCalledWith(email, password)
      expect(issueGrantSpy).toHaveBeenCalledWith(email, password)
      expect(userInfoSpy).toHaveBeenCalledWith(token.access_token?.token)
      expect(admin.auth).toHaveBeenCalled()
      expect(createPersonSpy).toHaveBeenCalled()
    })

    it('should handle bad password on login', async () => {
      const keycloakSpy = jest
        .spyOn(keycloak.grantManager, 'obtainDirectly')
        .mockRejectedValue(new Error('401:Unauthorized'))
      const loginDto = plainToClass(LoginDto, { email, password })
      const loginSpy = jest.spyOn(service, 'login')
      const loggerSpy = jest.spyOn(Logger, 'error').mockImplementation()
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
      expect(loggerSpy).toBeCalled()
      loggerSpy.mockRestore()
    })
  })

  describe('createUser', () => {
    const email = 'someuser@example.com'
    const password = 's3cret'
    const firstName = 'John'
    const lastName = 'Doe'
    const newsletter = true

    it('should call keycloak and prisma', async () => {
      const keycloakId = 'u123'
      const registerDto = plainToClass(RegisterDto, {
        email,
        password,
        firstName,
        lastName,
        newsletter,
      })
      jest.spyOn(marketing, 'addContactsToList').mockImplementation(async () => true)
      const createUserSpy = jest.spyOn(service, 'createUser')
      const adminSpy = jest.spyOn(admin.users, 'create').mockResolvedValue({ id: keycloakId })
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
        create: { keycloakId, email, firstName, lastName, newsletter },
        update: { keycloakId },
        where: { email },
      })
    })

    it('should handle bad password on registration', async () => {
      admin.accessToken = 't23456'
      const registerDto = plainToClass(RegisterDto, { email, password, firstName, lastName })
      const createUserSpy = jest.spyOn(service, 'createUser')
      const loggerSpy = jest.spyOn(Logger, 'error').mockImplementation()
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
      expect(loggerSpy).toBeCalled()
      loggerSpy.mockRestore()
    })

    it('should subscribe email to marketing list if consent is given', async () => {
      const keycloakId = 'u123'
      const registerDto = plainToClass(RegisterDto, {
        email,
        password,
        firstName,
        lastName,
        // Add to marketing list
        newsletter: true,
      })
      const person: Person = {
        id: 'e43348aa-be33-4c12-80bf-2adfbf8736cd',
        firstName,
        lastName,
        keycloakId,
        email,
        emailConfirmed: false,
        phone: null,
        company: null,
        picture: null,
        createdAt: new Date('2021-10-07T13:38:11.097Z'),
        updatedAt: new Date('2021-10-07T13:38:11.097Z'),
        newsletter: true,
        address: null,
        birthday: null,
        personalNumber: null,
        stripeCustomerId: null,
      }
      jest.spyOn(prismaMock.person, 'upsert').mockResolvedValue(person)
      jest.spyOn(admin.users, 'create').mockResolvedValue({ id: keycloakId })
      const marketingSpy = jest
        .spyOn(marketing, 'addContactsToList')
        .mockImplementation(async () => true)

      await service.createUser(registerDto)

      // Check was added to list
      expect(marketingSpy).toHaveBeenCalledWith({
        contacts: [
          {
            email,
            first_name: firstName,
            last_name: lastName,
          },
        ],
        list_ids: ['list-id'],
      })
    })

    it('should NOT subscribe email to marketing list if NO consent is given', async () => {
      const keycloakId = 'u123'
      const registerDto = plainToClass(RegisterDto, {
        email,
        password,
        firstName,
        lastName,
        // Don't subscribe to marketing list
        newsletter: false,
      })
      const person: Person = {
        id: 'e43348aa-be33-4c12-80bf-2adfbf8736cd',
        firstName,
        lastName,
        keycloakId,
        email,
        emailConfirmed: false,
        phone: null,
        company: null,
        picture: null,
        createdAt: new Date('2021-10-07T13:38:11.097Z'),
        updatedAt: new Date('2021-10-07T13:38:11.097Z'),
        newsletter: false,
        address: null,
        birthday: null,
        personalNumber: null,
        stripeCustomerId: null,
      }
      jest.spyOn(prismaMock.person, 'upsert').mockResolvedValue(person)
      jest.spyOn(admin.users, 'create').mockResolvedValue({ id: keycloakId })
      const marketingSpy = jest
        .spyOn(marketing, 'addContactsToList')
        .mockImplementation(async () => true)

      await service.createUser(registerDto)

      // Check was not added to list
      expect(marketingSpy).not.toHaveBeenCalled()
    })
  })
})
