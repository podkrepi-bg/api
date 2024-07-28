import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { catchError, firstValueFrom, map, Observable, retry, timer } from 'rxjs'
import KeycloakConnect from 'keycloak-connect'
import { ConfigService } from '@nestjs/config'
import { KEYCLOAK_INSTANCE } from 'nest-keycloak-connect'
import KeycloakAdminClient from '@keycloak/keycloak-admin-client'
import { RequiredActionAlias } from '@keycloak/keycloak-admin-client/lib/defs/requiredActionProviderRepresentation'
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces'
import { TokenResponseRaw } from '@keycloak/keycloak-admin-client/lib/utils/auth'

import { Company, Person } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { LoginDto } from './dto/login.dto'
import { ProfileType, RegisterDto } from './dto/register.dto'
import { RefreshDto } from './dto/refresh.dto'
import { KeycloakTokenParsed } from './keycloak'
import { ProviderDto } from './dto/provider.dto'
import { UpdatePersonDto } from '../person/dto/update-person.dto'
import { ForgottenPasswordEmailDto } from './dto/forgot-password.dto'
import { JwtService } from '@nestjs/jwt'
import { EmailService } from '../email/email.service'
import { ForgottenPasswordMailDto } from '../email/template.interface'
import { NewPasswordDto } from './dto/recovery-password.dto'
import { MarketingNotificationsService } from '../notifications/notifications.service'
import { PersonService } from '../person/person.service'
import FederatedIdentityRepresentation from '@keycloak/keycloak-admin-client/lib/defs/federatedIdentityRepresentation'

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
    private jwtService: JwtService,
    private sendEmail: EmailService,
    @Inject(KEYCLOAK_INSTANCE) private keycloak: KeycloakConnect.Keycloak,
    private readonly marketingNotificationsService: MarketingNotificationsService,
    private readonly personService: PersonService,
  ) {}

  async issueGrant(email: string, password: string): Promise<KeycloakConnect.Grant> {
    return this.keycloak.grantManager.obtainDirectly(email, password)
  }

  shouldRetry(error: AxiosResponse) {
    //Retry request if status is 409.
    if (error.status === 409) {
      Logger.debug(`Retrying oauth query`)
      return timer(1000) // Adding a timer from RxJS to return observable to delay param.
    }

    throw error
  }

  async tokenEndpoint(
    data: Record<'grant_type' & string, string>,
    providerDto?: ProviderDto,
  ): Promise<Observable<ApiTokenResponse>> {
    const params = new URLSearchParams({
      ...this.requestSecrets(),
      ...data,
    })

    return this.httpService
      .post<KeycloakErrorResponse | TokenResponseRaw>(this.createTokenUrl(), params.toString())
      .pipe(
        map((res: AxiosResponse<TokenResponseRaw>) => ({
          refreshToken: res.data.refresh_token,
          accessToken: res.data.access_token,
          expires: res.data.expires_in,
        })),
        catchError(async ({ response }: { response: AxiosResponse<KeycloakErrorResponse> }) => {
          const error = response.data
          Logger.error("Couldn't get authentication from keycloak. Error: " + JSON.stringify(error))

          if (
            error.error === 'invalid_token' &&
            error.error_description === 'User already exists'
          ) {
            //User already exists. Link IDP data to it
            if (!providerDto)
              throw new BadRequestException('ProviderDto must be passed to tokenEndpoint')
            const person = await this.prismaService.person.findUnique({
              where: { email: providerDto?.email },
            })
            if (!person || !person.keycloakId)
              throw new NotFoundException(`No user found with email ${providerDto?.email}`)

            //Create Oauth Link with existing account
            await this.addUserToFederatedIdentity(providerDto, person.keycloakId)
            throw new ConflictException('User already exists')
          }
          if (error.error === 'invalid_grant') {
            throw new UnauthorizedException(error['error_description'])
          }

          throw new InternalServerErrorException('CannotIssueTokenError')
        }),
        retry({ count: 2, delay: this.shouldRetry }),
      )
  }

  async issueTokenFromProvider(
    providerDto: ProviderDto,
  ): Promise<Observable<ApiTokenResponse | ErrorResponse>> {
    const data = {
      grant_type: <const>'urn:ietf:params:oauth:grant-type:token-exchange',
      subject_token: providerDto.providerToken,
      subject_issuer: providerDto.provider,
      subject_token_type: 'urn:ietf:params:oauth:token-type:access_token',
    }
    const tokenObs$ = await this.tokenEndpoint(data, providerDto)
    const keycloakResponse = await firstValueFrom(tokenObs$)
    const userInfo = await this.keycloak.grantManager.userInfo<string, KeycloakTokenParsed>(
      keycloakResponse.accessToken as string,
    )
    await this.prismaService.person.upsert({
      // Create a person with the provided keycloakId
      create: {
        email: userInfo.email || '',
        firstName: userInfo.given_name || '',
        lastName: userInfo.family_name || '',
        picture: providerDto.picture,
        keycloakId: userInfo.sub,
      },
      // Store keycloakId to the person with same email
      update: { keycloakId: userInfo.sub },
      where: { email: userInfo.email },
    })
    return tokenObs$
  }

  async issueToken(email: string, password: string): Promise<string | undefined> {
    const grant = await this.issueGrant(email, password)
    return grant.access_token?.token
  }

  async issueTokenFromRefresh(
    refreshDto: RefreshDto,
  ): Promise<Observable<ApiTokenResponse | ErrorResponse>> {
    const data = {
      refresh_token: refreshDto.refreshToken,
      grant_type: <const>'refresh_token',
    }
    return this.tokenEndpoint(data)
  }

  async login(loginDto: LoginDto): Promise<ApiTokenResponse | ErrorResponse> {
    try {
      const grant = await this.issueGrant(loginDto.email, loginDto.password)
      if (!grant.access_token?.token) {
        throw new InternalServerErrorException('CannotIssueTokenError')
      }
      const user = await this.keycloak.grantManager.userInfo<string, KeycloakTokenParsed>(
        grant.access_token.token as string,
      )
      const person = await this.prismaService.person.findUnique({ where: { email: user.email } })
      if (!person || person.keycloakId !== user.sub) {
        Logger.warn('No person found for the current keycloak user. Creating new one...')
        await this.authenticateAdmin()
        const userData = await this.admin.users.findOne({ id: user.sub })
        const registerDto: RegisterDto = {
          type: ProfileType.INDIVIDUAL,
          email: userData?.email ?? '',
          password: '',
          firstName: userData?.firstName ?? '',
          lastName: userData?.lastName ?? '',
          companyName: undefined,
          companyNumber: undefined,
        }
        await this.createPerson(registerDto, user.sub, undefined)
      }
      return {
        refreshToken: grant.refresh_token?.token,
        accessToken: grant.access_token.token,
        expires: grant.expires_in,
      }
    } catch (error) {
      Logger.error(error)
      if (error.message === '401:Unauthorized') {
        throw new UnauthorizedException(error.message, error?.response?.data)
      }
      throw error
    }
  }

  async createUser(
    registerDto: RegisterDto,
    isCorporateReg = false,
  ): Promise<Person | ErrorResponse> {
    let person: Person
    let company: Company | null = null
    try {
      await this.authenticateAdmin()
      // Create user in Keycloak
      const user = await this.createKeycloakUser(registerDto, false, !isCorporateReg)
      // Insert or connect person in app db
      if (isCorporateReg) {
        company = await this.createCompany(registerDto)
      }
      person = await this.createPerson(registerDto, user.id, company?.id)
    } catch (error) {
      const response = {
        error: error.message,
        data: error?.response?.data,
      }
      Logger.error(response)
      return response
    }

    // Add to marketing platform
    if (registerDto.newsletter)
      try {
        // Add email to general marketing notifications list
        const mainList = this.config.get('sendgrid.marketingListId')
        if (mainList)
          await this.marketingNotificationsService.provider.addContactsToList({
            contacts: [
              {
                email: registerDto.email,
                first_name: registerDto.firstName,
                last_name: registerDto.lastName,
              },
            ],
            list_ids: [mainList],
          })
      } catch (e) {
        Logger.error('Failed to subscribe email', e)
      }

    return person
  }

  private async authenticateAdmin() {
    await this.admin.auth({
      grantType: 'client_credentials',
      clientId: this.config.get<string>('keycloak.clientId') || '',
      clientSecret: this.config.get<string>('keycloak.secret') || '',
    })
  }

  private async createKeycloakUser(
    registerDto: RegisterDto,
    verifyEmail: boolean,
    activeProfile = true,
  ) {
    return await this.admin.users.create({
      username: registerDto.email,
      email: registerDto.email,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      enabled: activeProfile,
      emailVerified: true,
      groups: [],
      requiredActions: verifyEmail ? [RequiredActionAlias.VERIFY_EMAIL] : [],
      attributes: { selfReg: true, companyName: registerDto.companyName },
      credentials: [
        {
          type: 'password',
          value: registerDto.password,
          temporary: false,
        },
      ],
    })
  }

  private requestSecrets() {
    const secret = this.config.get<string>('keycloak.secret') || ''
    const clientId = this.config.get<string>('keycloak.clientId') || ''
    return {
      client_secret: secret,
      client_id: clientId,
    }
  }

  private async addUserToFederatedIdentity(providerDto: ProviderDto, keycloakId: string) {
    const params = {
      identityProvider: providerDto.provider,
      userId: providerDto.userId,
      userName: providerDto.name,
    } as FederatedIdentityRepresentation

    try {
      await this.authenticateAdmin()
      const result = await this.admin.users.addToFederatedIdentity({
        id: keycloakId,
        federatedIdentityId: providerDto.provider,
        federatedIdentity: params,
      })
      Logger.debug(result)
      return result
    } catch (err) {
      Logger.debug(err)
      throw err
    }
  }

  private createIdentityLinkUrl(keycloakId: string, provider: string) {
    const serverUrl = this.config.get<string>('keycloak.serverUrl')
    const realm = this.config.get<string>('keycloak.realm')
    //http://localhost:8180/auth/admin/realms/webapp/users/2545d07e-3e7d-4e8f-932e-c5e5153227a4/federated-identity/google
    return `${serverUrl}/realms/${realm}/users/${keycloakId}/federated-identity/${provider}`
  }

  private createTokenUrl() {
    const serverUrl = this.config.get<string>('keycloak.serverUrl')
    const realm = this.config.get<string>('keycloak.realm')
    return `${serverUrl}/realms/${realm}/protocol/openid-connect/token`
  }

  private async createPerson(
    registerDto: RegisterDto,
    keycloakId: string,
    companyId: string | null | undefined,
  ) {
    return await this.prismaService.person.upsert({
      // Create a person with the provided keycloakId
      create: {
        keycloakId,
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        newsletter: registerDto.newsletter ? registerDto.newsletter : false,
        companyId: companyId,
        profileEnabled: companyId ? false : true,
        helpUsImprove: registerDto.helpUsImprove ? registerDto.helpUsImprove : false,
      },
      // Store keycloakId to the person with same email
      update: { keycloakId },
      where: { email: registerDto.email },
    })
  }

  private async createCompany(registerDto: RegisterDto): Promise<Company> {
    if (!registerDto.companyName || !registerDto.companyNumber) {
      throw new BadRequestException('Company name and companyNumber are missing')
    }
    return await this.prismaService.company.create({
      // Create a person with the provided keycloakId
      data: {
        companyNumber: registerDto.companyNumber,
        companyName: registerDto.companyName,
        legalPersonName: registerDto.firstName + ' ' + registerDto.lastName,
      },
      // Store keycloakId to the person with same email
    })
  }

  async updateUser(keycloakId: string, updateDto: UpdatePersonDto) {
    await this.authenticateAdmin()
    await this.admin.users.update(
      { id: keycloakId },
      {
        username: updateDto.email,
        email: updateDto.email,
        firstName: updateDto.firstName,
        lastName: updateDto.lastName,
        emailVerified: true,
        requiredActions: [],
        enabled: true,
      },
    )
    return await this.prismaService.person.update({
      where: { keycloakId },
      data: {
        firstName: updateDto.firstName,
        lastName: updateDto.lastName,
        email: updateDto.email,
        birthday: updateDto.birthday,
      },
    })
  }

  async updateUserPassword(keycloakId: string, credentialsDto) {
    await this.authenticateAdmin()
    await this.admin.users.resetPassword({
      id: keycloakId,
      credential: {
        temporary: false,
        type: 'password',
        value: credentialsDto.password,
      },
    })
    return true
  }

  async changeEnabledStatus(keycloakId: string, enabled: boolean) {
    await this.authenticateAdmin()
    // check if user is admin before attempting to activate/deactivate
    const userGroups = await this.admin.users.listRoleMappings({ id: keycloakId })
    const isAdmin = userGroups.realmMappings?.some(
      (obj) =>
        obj.name === 'team-support' ||
        obj.name === 'view-supporters' ||
        obj.name === 'view-contact-requests',
    )
    if (isAdmin) {
      throw new ForbiddenException("Admin profiles can't be deactivated")
    }
    await this.admin.users.update(
      { id: keycloakId },
      {
        enabled,
      },
    )
    return await this.prismaService.person.update({
      where: { keycloakId },
      data: { profileEnabled: enabled },
    })
  }

  async sendMailForPasswordChange(forgotPasswordDto: ForgottenPasswordEmailDto) {
    const stage = this.config.get<string>('APP_ENV') === 'development' ? 'APP_URL_LOCAL' : 'APP_URL'
    const person = await this.prismaService.person.findFirst({
      where: { email: forgotPasswordDto.email },
    })

    if (!person || !person.email) {
      throw new NotFoundException('Invalid email')
    }

    const payload = { username: person.email, sub: person.keycloakId }
    const jtwSecret = process.env.JWT_SECRET_KEY
    const access_token = this.jwtService.sign(payload, {
      secret: jtwSecret,
      expiresIn: '60m',
    })
    const appUrl = this.config.get<string>(stage)
    const link = `${appUrl}/change-password?token=${access_token}`
    const profile = {
      email: person.email,
      firstName: person.firstName,
      lastName: person.lastName,
      link: link,
    }
    const userEmail = { to: [person.email] }
    const mail = new ForgottenPasswordMailDto(profile)
    await this.sendEmail.sendFromTemplate(mail, userEmail, {
      //Allow users to receive the mail, regardles of unsubscribes
      bypassUnsubscribeManagement: { enable: true },
    })
  }

  async updateForgottenPassword(recoveryPasswordDto: NewPasswordDto) {
    try {
      const { sub: keycloakId } = this.jwtService.verify(recoveryPasswordDto.token, {
        secret: process.env.JWT_SECRET_KEY,
      })
      return await this.updateUserPassword(keycloakId, recoveryPasswordDto)
    } catch (error) {
      const response = {
        error: error.message,
        data: error?.response?.data,
      }
      throw response.data
        ? new NotFoundException(response.data)
        : new BadRequestException(
            'The forgotten password link has expired, request a new link and try again!',
          )
    }
  }

  async deleteUser(keycloakId: string) {
    const user = await this.personService.findOneByKeycloakId(keycloakId)

    //Check and throw if user is a beneficiary, organizer or corporate profile
    if ((!!user && user.beneficiaries.length > 0) || user?.organizer || user?.companyId) {
      throw new InternalServerErrorException(
        'Cannot delete a beneficiary, organizer or corporate profile',
      )
    }

    return this.authenticateAdmin()
      .then(() => this.admin.users.del({ id: keycloakId }))
      .then(() => this.prismaService.person.delete({ where: { keycloakId } }))
      .then(() => Logger.log(`User with keycloak id ${keycloakId} was successfully deleted!`))
      .catch((err) => {
        const errorMessage = `Deleting user fails with reason: ${err.message ?? 'server error!'}`
        Logger.error(errorMessage)
        throw new InternalServerErrorException(errorMessage)
      })
  }
}
