import {
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { catchError, firstValueFrom, map, Observable } from 'rxjs'
import KeycloakConnect from 'keycloak-connect'
import { ConfigService } from '@nestjs/config'
import { KEYCLOAK_INSTANCE } from 'nest-keycloak-connect'
import KeycloakAdminClient from '@keycloak/keycloak-admin-client'
import { RequiredActionAlias } from '@keycloak/keycloak-admin-client/lib/defs/requiredActionProviderRepresentation'
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces'
import { TokenResponseRaw } from '@keycloak/keycloak-admin-client/lib/utils/auth'

import { Person } from '.prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { RefreshDto } from './dto/refresh.dto'
import { KeycloakTokenParsed } from './keycloak'
import e from 'express'
import { ProviderDto } from './dto/provider.dto'

type ErrorResponse = { error: string; data: unknown }
type KeycloakErrorResponse = { error: string; error_description: string }
type ApiTokenResponse = {
  expires: string | undefined
  accessToken: string | undefined
  refreshToken: string | undefined
}

/**
 * Add missing `token` field to `KeycloakConnect.Token`
 * ¯\_(ツ)_/¯
 */
declare module 'keycloak-connect' {
  interface Token {
    token: string | undefined
    content: KeycloakTokenParsed | undefined
  }
}

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly admin: KeycloakAdminClient,
    private readonly prismaService: PrismaService,
    private readonly httpService: HttpService,
    @Inject(KEYCLOAK_INSTANCE) private keycloak: KeycloakConnect.Keycloak,
  ) {}

  async issueGrant(email: string, password: string): Promise<KeycloakConnect.Grant> {
    return this.keycloak.grantManager.obtainDirectly(email, password)
  }

  async issueTokenFromProvider(
    providerDto: ProviderDto,
  ): Promise<Observable<ApiTokenResponse | ErrorResponse>> {
    const secret = this.config.get<string>('keycloak.secret')
    const clientId = this.config.get<string>('keycloak.clientId')
    const tokenUrl = `${this.config.get<string>(
      'keycloak.serverUrl',
    )}/realms/${this.config.get<string>('keycloak.realm')}/protocol/openid-connect/token`
    const data = {
      client_id: clientId as string,
      client_secret: secret as string,
      grant_type: <const>'urn:ietf:params:oauth:grant-type:token-exchange',
      subject_token: providerDto.providerToken,
      subject_issuer: providerDto.provider,
      subject_token_type: 'urn:ietf:params:oauth:token-type:access_token',
    }
    const params = new URLSearchParams(data)
    const $tokenObs = this.httpService
      .post<KeycloakErrorResponse | TokenResponseRaw>(tokenUrl, params.toString())
      .pipe(
        map((res: AxiosResponse<TokenResponseRaw>) => ({
          refreshToken: res.data.refresh_token,
          accessToken: res.data.access_token,
          expires: res.data.expires_in,
        })),
        catchError(({ response }: { response: AxiosResponse<KeycloakErrorResponse> }) => {
          const error = response.data
          if (error.error === 'invalid_grant') {
            throw new UnauthorizedException(error['error_description'])
          }
          throw new InternalServerErrorException('CannotIssueTokenError')
        }),
      )
    const keycloakResponse = await firstValueFrom($tokenObs)
    const userInfo = await this.keycloak.grantManager.userInfo<string, KeycloakTokenParsed>(
      keycloakResponse.accessToken,
    )
    await this.prismaService.person.upsert({
      // Create a person with the provided keycloakId
      create: {
        email: userInfo.email || '',
        firstName: userInfo.given_name || '',
        lastName: userInfo.family_name || '',
      },
      // Store keycloakId to the person with same email
      update: { keycloakId: userInfo.sub },
      where: { email: userInfo.email },
    })
    return $tokenObs
  }

  async issueToken(email: string, password: string): Promise<string | undefined> {
    const grant = await this.issueGrant(email, password)
    return grant.access_token?.token
  }

  async issueTokenFromRefresh(
    refreshDto: RefreshDto,
  ): Promise<Observable<ApiTokenResponse | ErrorResponse>> {
    const secret = this.config.get<string>('keycloak.secret')
    const clientId = this.config.get<string>('keycloak.clientId')
    const tokenUrl = `${this.config.get<string>(
      'keycloak.serverUrl',
    )}/realms/${this.config.get<string>('keycloak.realm')}/protocol/openid-connect/token`
    const data = {
      client_id: clientId as string,
      client_secret: secret as string,
      refresh_token: refreshDto.refreshToken,
      grant_type: <const>'refresh_token',
    }
    const params = new URLSearchParams(data)
    return this.httpService
      .post<KeycloakErrorResponse | TokenResponseRaw>(tokenUrl, params.toString())
      .pipe(
        map((res: AxiosResponse<TokenResponseRaw>) => ({
          refreshToken: res.data.refresh_token,
          accessToken: res.data.access_token,
          expires: res.data.expires_in,
        })),
        catchError(({ response }: { response: AxiosResponse<KeycloakErrorResponse> }) => {
          const error = response.data
          if (error.error === 'invalid_grant') {
            throw new UnauthorizedException(error['error_description'])
          }
          throw new InternalServerErrorException('CannotIssueTokenError')
        }),
      )
  }

  async login(loginDto: LoginDto): Promise<ApiTokenResponse | ErrorResponse> {
    try {
      const grant = await this.issueGrant(loginDto.email, loginDto.password)
      if (!grant.access_token?.token) {
        throw new InternalServerErrorException('CannotIssueTokenError')
      }
      return {
        refreshToken: grant.refresh_token?.token,
        accessToken: grant.access_token.token,
        expires: grant.expires_in,
      }
    } catch (error) {
      console.error(error)
      if (error.message === '401:Unauthorized') {
        throw new UnauthorizedException(error.message, error?.response?.data)
      }
      throw error
    }
  }

  async createUser(registerDto: RegisterDto): Promise<Person | ErrorResponse> {
    try {
      await this.authenticateAdmin()
      // Create user in Keycloak
      const user = await this.createKeycloakUser(registerDto, false)
      // Insert or connect person in app db
      return await this.createPerson(registerDto, user.id)
    } catch (error) {
      const response = {
        error: error.message,
        data: error?.response?.data,
      }
      console.error(response)
      return response
    }
  }

  private async authenticateAdmin() {
    await this.admin.auth({
      grantType: 'client_credentials',
      clientId: this.config.get<string>('keycloak.clientId') || '',
      clientSecret: this.config.get<string>('keycloak.secret') || '',
    })
  }

  private async createKeycloakUser(registerDto: RegisterDto, verifyEmail: boolean) {
    return await this.admin.users.create({
      username: registerDto.email,
      email: registerDto.email,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      enabled: true,
      emailVerified: true,
      groups: [],
      requiredActions: verifyEmail ? [RequiredActionAlias.VERIFY_EMAIL] : [],
      attributes: { selfReg: true },
      credentials: [
        {
          type: 'password',
          value: registerDto.password,
          temporary: false,
        },
      ],
    })
  }

  private async createPerson(registerDto: RegisterDto, keycloakId: string) {
    return await this.prismaService.person.upsert({
      // Create a person with the provided keycloakId
      create: {
        keycloakId,
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
      },
      // Store keycloakId to the person with same email
      update: { keycloakId },
      where: { email: registerDto.email },
    })
  }
}
