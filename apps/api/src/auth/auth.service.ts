import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import KeycloakAdminClient from '@keycloak/keycloak-admin-client'
import { RequiredActionAlias } from '@keycloak/keycloak-admin-client/lib/defs/requiredActionProviderRepresentation'

import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { PrismaService } from '../prisma/prisma.service'
import { Person } from '.prisma/client'

type ErrorResponse = { error: string; data: unknown }

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly admin: KeycloakAdminClient,
    private readonly prismaService: PrismaService,
  ) {}

  async issueToken(email: string, password: string): Promise<string> {
    await this.admin.auth({
      clientId: this.config.get<string>('keycloak.clientId') || '',
      clientSecret: this.config.get<string>('keycloak.secret') || '',
      grantType: 'password',
      username: email,
      password: password,
    })
    return this.admin.accessToken
  }

  async login(loginDto: LoginDto): Promise<{ jwt: string } | ErrorResponse> {
    try {
      const jwt = await this.issueToken(loginDto.email, loginDto.password)
      return { jwt }
    } catch (error) {
      const response = {
        error: error.message,
        data: error?.response?.data,
      }
      console.error(response)
      return response
    }
  }

  async createUser(registerDto: RegisterDto): Promise<Person | ErrorResponse> {
    try {
      await this.authenticateAdmin()
      // Create user in Keycloak
      const user = await this.createKeycloakUser(registerDto)
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

  private async createKeycloakUser(registerDto: RegisterDto) {
    return await this.admin.users.create({
      username: registerDto.email,
      email: registerDto.email,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      enabled: true,
      emailVerified: true,
      groups: [],
      requiredActions: [RequiredActionAlias.VERIFY_EMAIL],
      attributes: {},
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
